import express from "express";
import { getSupabaseClient } from "../lib/supabaseClient.js";
import { logEvent } from "../lib/logger.js";
import { requireUser } from "../middleware/requireUser.js";

const router = express.Router();

// Requiere sesión (Authorization: Bearer <token>)
router.use(requireUser);

// Vincula anon_id con el user_id autenticado y registra el vínculo.
router.post("/identity-link", async (req, res) => {
  const userId = req.userId;
  const anonId = String(req.body?.anon_id ?? "").trim();
  const email = req.body?.email;

  if (!anonId) {
    return res.status(400).json({ error: "anon_id es obligatorio." });
  }

  try {
    const supabase = getSupabaseClient();
    const payload = {
      user_id: userId,
      anon_id: anonId,
      linked_at: new Date().toISOString(),
    };
    if (email) {
      payload.email = email;
    }

    // Asumimos tabla audience_profiles (ajustar si usas otro nombre)
    const { error } = await supabase
      .from("crm.audience")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      throw error;
    }

    await logEvent({
      user_id: userId,
      action_type: "identity_link",
      context: "identity",
      detail: { anon_id: anonId },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("identity-link -> error", err?.message ?? err);
    return res.status(500).json({ error: "No se pudo vincular la identidad." });
  }
});

export default router;
