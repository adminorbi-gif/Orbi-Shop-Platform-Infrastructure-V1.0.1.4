import { Router } from "express";
import { callOrbiPayGateway } from "../lib/orbiPayGateway.js";

const router = Router();

function cleanIdentifier(value: unknown) {
  return String(value || "").trim().slice(0, 120);
}

router.post("/resolve", async (req, res) => {
  try {
    const identifier = cleanIdentifier(req.body?.identifier || req.body?.identity);
    if (identifier.length < 3) {
      return res.status(400).json({
        success: false,
        error: "IDENTITY_REQUIRED",
        message: "Provide ORBI ID, phone, or email.",
      });
    }

    const result = await callOrbiPayGateway("/v1/identity/resolve", {
      method: "POST",
      body: {
        identifier,
        metadata: {
          source: "orbi-shop",
          context: "checkout_payment_identity",
        },
      },
    });

    return res.json(result);
  } catch (error: any) {
    const message = String(error?.message || "IDENTITY_RESOLVE_FAILED");
    return res.status(error?.status || (message === "IDENTITY_NOT_FOUND" ? 404 : 502)).json({
      success: false,
      error: message,
      message: message === "IDENTITY_NOT_FOUND"
        ? "We could not find that ORBI account."
        : "Identity lookup could not be completed.",
    });
  }
});

export default router;
