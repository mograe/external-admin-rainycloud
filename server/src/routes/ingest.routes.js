import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requireApiToken } from "../auth/apiTokenAuth.js";
import { id } from "zod/locales";

const router = Router();

const itemSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.number().int().default(1),
  showNumber: z.number().int(),
  socketConnections: z.number().int(),
  movieTitle: z.string().min(1),
  moviePath: z.string().optional().nullable(),
  movieId: z.union([z.string(), z.number()]).optional().nullable(),
  startedAtUtc: z.string().min(1),
  finishedAtUtc: z.string().min(1),
  durationMinutes: z.number().int().min(0).default(0),
  clientTimezone: z.string().optional().nullable(),
  clientUtcOffsetMinutes: z.number().int().optional().nullable(),
  createdAtUtc: z.string().optional().nullable(),
  updatedAtUtc: z.string().optional().nullable()
});

const batchSchema = z.object({
    items: z.array(itemSchema).min(1).max(500)
});

router.post("/show-logs", requireApiToken, async (req, res) => {
    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "BAD_REQUEST", details: z.treeifyError(parsed.error) });
    }

    const acceptedIds = [];
    const rejected = [];

    const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO show_logs (
        id,
        schema_version,
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
        received_at_utc,
        raw_payload
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = db.transaction((items) => {
        for (const item of items) {
            try {
                insertStmt.run(
                item.id,
                item.schemaVersion ?? 1,
                req.apiClient.id,
                req.apiClient.name,
                item.showNumber,
                item.socketConnections,
                item.movieTitle,
                item.moviePath ?? null,
                item.movieId != null ? String(item.movieId) : null,
                item.startedAtUtc,
                item.finishedAtUtc,
                item.durationMinutes ?? 0,
                item.clientTimezone ?? null,
                item.clientUtcOffsetMinutes ?? null,
                new Date().toISOString(),
                JSON.stringify(item)
                );
                acceptedIds.push(item.id);
            } catch (e) {
                rejected.push({
                    id: item.id,
                    reason: "INSERT_FAILED"
                });
            }
        }
    });

    tx(parsed.data.items);

    res.json({
        acceptedIds,
        rejected
    })
});

export default router;