import { verifyAdminToken, getAdminCookieName } from "./jwt.js";

export function requireAdmin(req, res, next) {
    try {
        const token = req.cookies[getAdminCookieName()];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const payload = verifyAdminToken(token);
        req.admin = payload;
        next();
    } catch {
        return res.status(401).json({ error: "Unauthorized" });
    }
}