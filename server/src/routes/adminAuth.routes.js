import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { verifyPassword } from "../auth/password.js";
import { signAdminToken, setAdminCookie, clearAdminCookie } from "../auth/jwt.js";
import { requireAdmin } from "../auth/adminAuth.js";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "BAD_REQUEST" });
  }

  const { username, password } = parsed.data;

  const user = db.prepare(`
    SELECT id, username, password_hash, role
    FROM admin_users
    WHERE username = ?
  `).get(username);

  if (!user) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }

  const token = signAdminToken({
    sub: user.id,
    username: user.username,
    role: user.role
  });

  setAdminCookie(res, token);

  return res.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

router.post("/logout", (_req, res) => {
  clearAdminCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({
    user: {
      id: req.admin.sub,
      username: req.admin.username,
      role: req.admin.role
    }
  });
});

export default router;