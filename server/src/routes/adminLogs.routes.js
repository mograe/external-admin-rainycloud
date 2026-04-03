import { Router } from "express";
import { db } from "../db.js";
import { requireAdmin } from "../auth/adminAuth.js";

const router = Router();

router.use(requireAdmin);

function getQueryString(value, fallback = "") {
  if (typeof value === "string") return value.trim();

  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first.trim() : fallback;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  return fallback;
}

function getQueryInt(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  const raw = getQueryString(value, "");
  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

const SORT_FIELDS = {
  id: "id",
  source_client_id: "source_client_id",
  source_client_name: "source_client_name",
  show_number: "show_number",
  socket_connections: "socket_connections",
  movie_title: "movie_title",
  movie_path: "movie_path",
  movie_id: "movie_id",
  started_at_utc: "started_at_utc",
  finished_at_utc: "finished_at_utc",
  duration_minutes: "duration_minutes",
  client_timezone: "client_timezone",
  client_utc_offset_minutes: "client_utc_offset_minutes",
  received_at_utc: "received_at_utc",
};

function getSortField(value) {
  const raw = getQueryString(value, "finished_at_utc");
  return SORT_FIELDS[raw] || "finished_at_utc";
}

function getSortDir(value) {
  const raw = getQueryString(value, "desc").toLowerCase();
  return raw === "asc" ? "ASC" : "DESC";
}

router.get("/logs", (req, res) => {
  const page = getQueryInt(req.query.page, 1, { min: 1 });
  const pageSize = getQueryInt(req.query.pageSize, 50, { min: 1, max: 200 });
  const offset = (page - 1) * pageSize;

  const q = getQueryString(req.query.q, "");
  const clientId = getQueryString(req.query.clientId, "");

  const sortBy = getSortField(req.query.sortBy);
  const sortDir = getSortDir(req.query.sortDir);

  const where = [];
  const params = [];

  if (q) {
    where.push("(movie_title LIKE ? OR movie_path LIKE ? OR id LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  if (clientId) {
    where.push("source_client_id = ?");
    params.push(clientId);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSql = `ORDER BY ${sortBy} ${sortDir}, id DESC`;

  const rows = db.prepare(`
    SELECT
      id,
      source_client_id,
      source_client_name,
      show_number,
      socket_connections,
      movie_title,
      movie_path,
      movie_id,
      started_at_utc,
      finished_at_utc,
      duration_minutes,
      client_timezone,
      client_utc_offset_minutes,
      received_at_utc
    FROM show_logs
    ${whereSql}
    ${orderSql}
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  const totalRow = db.prepare(`
    SELECT COUNT(*) as count
    FROM show_logs
    ${whereSql}
  `).get(...params);

  res.json({
    items: rows,
    page,
    pageSize,
    total: totalRow?.count ?? 0,
    sortBy,
    sortDir: sortDir.toLowerCase(),
  });
});

router.get("/logs/:id", (req, res) => {
  const id = typeof req.params.id === "string" ? req.params.id : "";

  const row = db.prepare(`
    SELECT *
    FROM show_logs
    WHERE id = ?
  `).get(id);

  if (!row) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  res.json(row);
});

router.get("/clients", (_req, res) => {
  const rows = db.prepare(`
    SELECT id, name, is_active, last_used_at, created_at
    FROM api_clients
    ORDER BY name ASC
  `).all();

  res.json({ items: rows });
});

export default router;