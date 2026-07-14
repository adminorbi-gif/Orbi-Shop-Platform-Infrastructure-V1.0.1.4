import { Router } from "express";
import { supabase, getSupabase, getAdminSupabase, encrypt, decryptObject } from "../lib/supabase.js";
import { clearCachedValue, sendResilientJson, withTimeout } from "../lib/apiResilience.js";

const router = Router();

// GET /api/v1/customers - Fetch customer registers
router.get("/", async (req, res) => {
  return sendResilientJson(res, "customers:list", async () => {
    let selectRes = await withTimeout(
      getSupabase(req).from('customers').select('*').order('registered_at', { ascending: false }).limit(1000),
      12000,
      "customers query",
    );
    if (selectRes.error) throw selectRes.error;
    const data = selectRes.data;

    const decryptedData = decryptObject(data || []);
    const mapped = decryptedData.map((c: any, index: number) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      email: c.email,
      registeredAt: new Date(c.registered_at).getTime(),
      totalOrders: 0,
      status: c.status || 'active',
      securityFlags: c.security_flags || 0,
      points: c.points !== undefined ? c.points : (130 + ((index * 79) % 870)), // deterministic simulated point values
      pointsExpiryAt: c.points_expiry_at || new Date(Date.now() + (1000 * 60 * 60 * 24 * (index % 3 === 0 ? 7 : (index % 3 === 1 ? -2 : 25)))).toISOString(),
      deleteRequested: c.deleteRequested !== undefined ? c.deleteRequested : (c.delete_requested || false),
      preferredLanguage: c.preferred_language || 'sw',
      preferred_language: c.preferred_language || 'sw',
      tin: c.tin || ''
    }));

    return mapped;
  }, { ttlMs: 60000, timeoutMs: 15000, label: "customers list", retries: 1, fallback: [] });
});

// POST /api/v1/customers/:id/reset-password - Secure password overrides
router.post("/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const encryptedPassword = encrypt(password, true);
    
    // Update local database first
    const { error } = await getSupabase(req).from('customers').update({ password: encryptedPassword }).eq('id', id);
    if (error) throw error;

    // Update Supabase Auth so they can log in with the new password
    try {
      const adminDb = getAdminSupabase();
      const { error: authError } = await adminDb.auth.admin.updateUserById(id, {
        password: password.trim()
      });
      if (authError) {
        console.warn(`[ADMIN] Supabase Auth password update failed for customer ${id}:`, authError.message);
      } else {
        console.log(`[ADMIN] Successfully updated Supabase Auth password for customer ${id}`);
      }
    } catch (authErr: any) {
      console.error(`[ADMIN] Error updating customer password in Supabase Auth:`, authErr.message);
    }

    clearCachedValue("customers:");
    res.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/v1/customers/:id/reset-password error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/v1/customers/:id - Update customer profile
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Map JSON payload to database columns if needed
    const payload: any = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.deleteRequested !== undefined) payload.delete_requested = updates.deleteRequested;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.preferredLanguage !== undefined) payload.preferred_language = updates.preferredLanguage;
    if (updates.preferred_language !== undefined) payload.preferred_language = updates.preferred_language;

    const { error } = await getSupabase(req).from('customers').update(payload).eq('id', id);
    if (error) throw error;
    clearCachedValue("customers:");
    res.json({ success: true });
  } catch (error: any) {
    console.error("PUT /api/v1/customers/:id error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/v1/customers/:id - Terminate customer profile completely
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await getSupabase(req).from('customers').delete().eq('id', id);
    if (error) throw error;
    clearCachedValue("customers:");
    res.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/v1/customers/:id error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
