import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME;

export function signAdminToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: "7d",
        issuer: "external-log-server",
        audience: "admin"
    });
}

export function verifyAdminToken(token) {
    return jwt.verify(token, JWT_SECRET, {
        issuer: "external-log-server",
        audience: "admin"
    });
}

export function setAdminCookie(res, token) {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    });
}

export function clearAdminCookie(res) {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    });
}

export function getAdminCookieName() {
    return COOKIE_NAME;
}