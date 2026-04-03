import crypto from "node:crypto";
import {db} from "../db.js";

function sha256(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashApiToken(rawToken) {
    const pepper = process.env.API_TOKEN_PEPPER || "";
    return sha256(`${rawToken}:${pepper}`);
}

export function requireApiToken(req, res, next) {
    const auth = req.headers.authorization || "";
    const [type, token] = auth.split(" ");

    if (type !== "Bearer" || !token) {
        return res.status(401).json({ error: "INVALID_API_TOKEN" });
    }

    const tokenHash = hashApiToken(token);
    
    const client = db.prepare(`
        SELECT id, name, is_active
        FROM api_clients
        WHERE token_hash = ?
        `).get(tokenHash);

    if (!client || client.is_active !== 1) {
        return res.status(401).json({ error: "INVALID_API_TOKEN" });
    }

    db.prepare(`
        UPDATE api_clients
        SET last_used_at = ?
        WHERE id = ?
        `).run(new Date().toISOString(), client.id);

    req.apiClient = client;
    next();
}