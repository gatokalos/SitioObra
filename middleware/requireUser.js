import { getSupabaseClient } from "../lib/supabaseClient.js";

const extractBearerToken = (req) => {
  const authHeader = req.headers?.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() === "bearer" && token) {
    return token.trim();
  }
  return "";
};

/**
 * Middleware de autenticación: valida el JWT de Supabase y coloca userId en req.
 * Requiere que el frontend envíe Authorization: Bearer <access_token>.
 */
export async function requireUser(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Falta token en Authorization: Bearer <token>." });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user?.id) {
      return res.status(401).json({ error: "Token inválido o sesión expirada." });
    }

    req.user = data.user;
    req.userId = data.user.id;
    return next();
  } catch (err) {
    console.error("requireUser -> fallo al validar token", err?.message ?? err);
    return res.status(500).json({ error: "No se pudo validar la sesión." });
  }
}

export default requireUser;
