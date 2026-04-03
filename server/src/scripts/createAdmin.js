import "dotenv/config";
import crypto from "node:crypto";
import {db} from "../db.js";
import { hashPassword } from "../auth/password.js";

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
    console.error("Missing username or password");
    process.exit(1);
}

const now = new Date().toISOString();
const id = crypto.randomUUID();
const passwordHash = await hashPassword(password);

db.prepare(`
    INSERT INTO admin_users (id, username, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, 'admin', ?, ?)
    `).run(id, username, passwordHash, now, now);

console.log("Admin created: ", username);