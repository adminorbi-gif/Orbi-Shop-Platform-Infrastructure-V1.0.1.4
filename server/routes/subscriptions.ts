import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import path from "path";
import fs from "fs";

const router = Router();
const FINANCES_FILE = path.join(process.cwd(), "server/data/seller_lending_and_wallets.json");

function deductSellerOrbiWallet(sellerId: string, amount: number, planName: string) {
  let profile: any = null;
  try {
    if (fs.existsSync(FINANCES_FILE)) {
      const data = JSON.parse(fs.readFileSync(FINANCES_FILE, "utf8"));
      if (data[sellerId]) profile = data[sellerId];
    }
  } catch (e) {
    console.error("Error reading seller finances:", e);
  }

  if (!profile) {
    const scoreSeed = sellerId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const creditScore = 650 + (scoreSeed % 180);
    profile = {
      creditScore,
      salesVelocity: creditScore > 750 ? "excellent" : "good",
      paymentConsistency: creditScore > 720 ? "excellent" : "good",
      disputeRate: 0.0,
      hasEnabledStablecoins: false,
      tzsBalance: 1250000 + (scoreSeed % 15) * 450000,
      usdcBalance: (scoreSeed % 10) * 150,
      daiBalance: (scoreSeed % 5) * 80,
      loans: [],
      transactions: []
    };
  }

  if (profile.tzsBalance < amount) {
    throw new Error("Mizani yako ya Orbi Pay Wallet haitoshi kukamilisha malipo haya. Tafadhali weka fedha kwanza. / Insufficient Orbi Pay balance.");
  }

  profile.tzsBalance -= amount;
  profile.transactions = profile.transactions || [];
  profile.transactions.unshift({
    id: `TX-${Math.floor(Math.random() * 90000) + 10000}`,
    type: "subscription_payment",
    amount,
    currency: "TZS",
    timestamp: new Date().toISOString(),
    description: `Paid for ${planName} Booster subscription using Orbi Pay Wallet`,
    status: "success"
  });

  try {
    let allData: any = {};
    if (fs.existsSync(FINANCES_FILE)) {
      allData = JSON.parse(fs.readFileSync(FINANCES_FILE, "utf8"));
    }
    allData[sellerId] = profile;
    fs.writeFileSync(FINANCES_FILE, JSON.stringify(allData, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving seller finances:", e);
  }
}

/**
 * POST /api/subscriptions/subscribe
 * Processes a package upgrade request for a seller.
 * Computes expiration dates correctly based on subscription duration days.
 */
router.post("/subscribe", async (req: any, res: any) => {
  try {
    const { sellerId, planId, paymentDetails } = req.body;
    
    if (!sellerId || !planId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields (sellerId, planId)" 
      });
    }

    // 1. Fetch valid subscription plans
    const { data: promoData } = await supabase
      .from("promotions")
      .select("description")
      .eq("title", "SYSTEM_SUBSCRIPTION_PLANS")
      .maybeSingle();

    let plans = [
      { id: "sub-bronze", name: "Bronze", nameSw: "Shaba (Bronze)", price: 15000, days: 30, description: "Basic listings, Standard support", descriptionSw: "Orodha za msingi, Msaada wa kawaida", active: true },
      { id: "sub-silver", name: "Silver", nameSw: "Fedha (Silver)", price: 45000, days: 90, description: "Higher search ordering, Standard branding", descriptionSw: "Nafasi ya juu ya utafutaji, Nembo ya biashara", active: true },
      { id: "sub-gold", name: "Gold", nameSw: "Dhahabu (Gold)", price: 120000, days: 365, description: "Top placement, VIP seller badge, Premium support", descriptionSw: "Nafasi ya juu kabisa, Beji ya muuzaji wa VIP, Msaada wa haraka", active: true },
    ];

    if (promoData && promoData.description) {
      try {
        plans = JSON.parse(promoData.description);
      } catch (e) {
        console.warn("Could not parse SYSTEM_SUBSCRIPTION_PLANS description.", e);
      }
    }

    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: "Specifed subscription plan not found" 
      });
    }

    // Deduct balance if paid via Orbi Pay Wallet
    if (paymentDetails?.method === "orbi_wallet") {
      try {
        deductSellerOrbiWallet(sellerId, plan.price, plan.name);
      } catch (err: any) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
    }

    // 2. Fetch all sellers
    const { data: sellersPromo } = await supabase
      .from("promotions")
      .select("id, description")
      .eq("title", "SYSTEM_SELLERS")
      .maybeSingle();

    if (!sellersPromo) {
      return res.status(404).json({ 
        success: false, 
        message: "SYSTEM_SELLERS storage promotion not initialized yet" 
      });
    }

    let sellers: any[] = [];
    try {
      sellers = JSON.parse(sellersPromo.description || "[]");
    } catch (e) {
      console.warn("Could not parse SYSTEM_SELLERS description.", e);
    }

    const sellerIdx = sellers.findIndex((s) => s.id === sellerId);
    if (sellerIdx === -1) {
      return res.status(404).json({ 
        success: false, 
        message: `Seller profile ID '${sellerId}' not found` 
      });
    }

    const seller = sellers[sellerIdx];

    // 3. Calculate expiration: if already active PRO, extend it. Otherwise start from today.
    const addedTime = plan.days * 24 * 60 * 60 * 1000;
    const currentProUntil = seller.proUntil || 0;
    const newProUntil = currentProUntil > Date.now() ? currentProUntil + addedTime : Date.now() + addedTime;

    sellers[sellerIdx] = {
      ...seller,
      isPro: true,
      proUntil: newProUntil,
      activePlanId: plan.id,
      subscriptionPaidAt: Date.now()
    };

    // 4. Save back to Supabase securely
    const { error: updateError } = await supabase
      .from("promotions")
      .update({ description: JSON.stringify(sellers) })
      .eq("id", sellersPromo.id);

    if (updateError) {
      throw updateError;
    }

    return res.json({
      success: true,
      message: `Successfully subscripted to ${plan.name} Plan!`,
      proUntil: newProUntil,
      transactionId: `TX-ORBI-SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      planName: plan.name,
      status: "active"
    });

  } catch (error: any) {
    console.error("Subscription upgrade API error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to process subscription" 
    });
  }
});

export default router;
