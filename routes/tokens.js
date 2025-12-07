import express from "express";
import { getSupabaseClient } from "../lib/supabaseClient.js";
import { logEvent } from "../lib/logger.js";
import { requireUser } from "../middleware/requireUser.js";

const router = express.Router();

// Middleware de autenticación real (Supabase Auth)
router.use(requireUser);

// Helpers
const getBalance = async (supabase, userId) => {
  const { data, error } = await supabase
    .from("gatoken_balance")
    .select("total_tokens")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Number.isFinite(data?.total_tokens) ? Number(data.total_tokens) : 0;
};

const upsertBalance = async (supabase, userId, total) => {
  const { error } = await supabase
    .from("gatoken_balance")
    .upsert({ user_id: userId, total_tokens: total }, { onConflict: "user_id" });
  if (error) throw error;
};

const insertTransaction = async (supabase, payload) => {
  const { error } = await supabase.from("gatoken_transactions").insert(payload);
  if (error) throw error;
};

// GET /api/tokens/me -> saldo y últimos movimientos
router.get("/me", async (req, res) => {
  const userId = req.userId;
  try {
    const supabase = getSupabaseClient();
    const balance = await getBalance(supabase, userId);

    const { data: transactions = [], error } = await supabase
      .from("gatoken_transactions")
      .select("amount, action_type, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return res.json({ ok: true, balance, transactions });
  } catch (error) {
    console.error("tokens -> /me", error);
    return res.status(500).json({ error: "No se pudo obtener el saldo." });
  }
});

// POST /api/tokens/spend { amount, reason?, context?, metadata? }
router.post("/spend", async (req, res) => {
  const userId = req.userId;
  const amount = Number(req.body?.amount);
  const reason = String(req.body?.reason ?? "").trim();
  const context = String(req.body?.context ?? "app").trim() || "app";
  const metadata = req.body?.metadata ?? {};

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "amount debe ser mayor que cero." });
  }

  try {
    const supabase = getSupabaseClient();
    const current = await getBalance(supabase, userId);

    if (current < amount) {
      return res.status(400).json({
        error: "Saldo insuficiente.",
        balance: current,
        required: amount,
      });
    }

    const nextBalance = current - amount;

    await insertTransaction(supabase, {
      user_id: userId,
      amount: -amount,
      action_type: "spend",
      metadata: { reason, context, ...metadata },
    });

    await upsertBalance(supabase, userId, nextBalance);

    await logEvent({
      user_id: userId,
      action_type: "tokens_spend",
      context,
      detail: { amount, reason, previous_balance: current },
    });

    return res.json({ ok: true, balance: nextBalance, spent: amount });
  } catch (error) {
    console.error("tokens -> /spend", error);
    return res.status(500).json({ error: "No se pudo descontar tokens." });
  }
});

// POST /api/tokens/grant { amount, reason?, context?, metadata? }
router.post("/grant", async (req, res) => {
  const userId = req.userId;
  const amount = Number(req.body?.amount);
  const reason = String(req.body?.reason ?? "").trim();
  const context = String(req.body?.context ?? "reward").trim() || "reward";
  const metadata = req.body?.metadata ?? {};

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "amount debe ser mayor que cero." });
  }

  try {
    const supabase = getSupabaseClient();
    const current = await getBalance(supabase, userId);
    const nextBalance = current + amount;

    await insertTransaction(supabase, {
      user_id: userId,
      amount,
      action_type: "grant",
      metadata: { reason, context, ...metadata },
    });

    await upsertBalance(supabase, userId, nextBalance);

    await logEvent({
      user_id: userId,
      action_type: "tokens_grant",
      context,
      detail: { amount, reason, previous_balance: current },
    });

    return res.json({ ok: true, balance: nextBalance, granted: amount });
  } catch (error) {
    console.error("tokens -> /grant", error);
    return res.status(500).json({ error: "No se pudo otorgar tokens." });
  }
});

export default router;
