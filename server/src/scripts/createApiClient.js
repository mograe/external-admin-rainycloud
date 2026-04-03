import "dotenv/config";
import crypto from "node:crypto";
import {db} from "../db.js";
import { hashApiToken } from "../auth/apiTokenAuth.js";

const name = process.argv[2];

if (!name) {
    console.log("No name");
    process.exit(1);
}

const rawToken = crypto.randomBytes(32).toString("hex");
const tokenHash = hashApiToken(rawToken);
const id = crypto.randomUUID();
const now = new Date().toISOString();

db.prepare(`
    INSERT INTO api_clients (id, name, token_hash, is_active, created_at)
    VALUES (?, ?, ?, 1, ?)
    `).run(id, name, tokenHash, now);

console.log("Client created: ", name);
console.log("Token: ");
console.log(rawToken);