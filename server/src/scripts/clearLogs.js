import "dotenv/config";
import { db } from "../db.js";

const result = db.prepare(`
  DELETE FROM show_logs
`).run();

console.log(`Deleted ${result.changes} log(s).`);