import "dotenv/config";
import crypto from "node:crypto";
import { db } from "../db.js";

const count = Number(process.argv[2] || 25);

if (!Number.isInteger(count) || count <= 0) {
  console.error("Usage: node src/scripts/seedTestLogs.js 25");
  process.exit(1);
}

const movies = [
  { title: "Space Journey", path: "/videos/space-journey.mp4", movieId: "space-01" },
  { title: "Roller Coaster 360", path: "/videos/roller-coaster-360.mp4", movieId: "roller-01" },
  { title: "Ocean Dream", path: "/videos/ocean-dream.mp4", movieId: "ocean-01" },
  { title: "Rainy Cloud", path: "/videos/rainy-cloud.mp4", movieId: "rainy-01" },
  { title: "Forest Walk VR", path: "/videos/forest-walk-vr.mp4", movieId: "forest-01" },
  { title: "Skyline Flight", path: "/videos/skyline-flight.mp4", movieId: "sky-01" },
  { title: "Deep Cave Tour", path: "/videos/deep-cave-tour.mp4", movieId: "cave-01" },
];

const timezones = [
  { name: "Europe/Berlin", offset: 60 },
  { name: "Europe/Moscow", offset: 180 },
  { name: "Asia/Yekaterinburg", offset: 300 },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(items) {
  return items[randomInt(0, items.length - 1)];
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildFakeLog(index, client) {
  const movie = randomItem(movies);
  const tz = randomItem(timezones);

  const daysAgo = randomInt(0, 29);
  const startHour = randomInt(9, 23);
  const startMinute = randomInt(0, 59);
  const durationMinutes = randomInt(3, 28);

  const baseDate = addDays(new Date(), -daysAgo);
  const startedAt = new Date(baseDate);
  startedAt.setHours(startHour, startMinute, 0, 0);

  const finishedAt = addMinutes(startedAt, durationMinutes);
  const receivedAt = addMinutes(finishedAt, randomInt(0, 10));

  const socketConnections = randomInt(1, 25);

  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    sourceClientId: client?.id ?? null,
    sourceClientName: client?.name ?? null,
    showNumber: index + 1,
    socketConnections,
    movieTitle: movie.title,
    moviePath: movie.path,
    movieId: movie.movieId,
    startedAtUtc: startedAt.toISOString(),
    finishedAtUtc: finishedAt.toISOString(),
    durationMinutes,
    clientTimezone: tz.name,
    clientUtcOffsetMinutes: tz.offset,
    receivedAtUtc: receivedAt.toISOString(),
    rawPayload: JSON.stringify({
      id: crypto.randomUUID(),
      schemaVersion: 1,
      showNumber: index + 1,
      socketConnections,
      movieTitle: movie.title,
      moviePath: movie.path,
      movieId: movie.movieId,
      startedAtUtc: startedAt.toISOString(),
      finishedAtUtc: finishedAt.toISOString(),
      durationMinutes,
      clientTimezone: tz.name,
      clientUtcOffsetMinutes: tz.offset,
      createdAtUtc: finishedAt.toISOString(),
      updatedAtUtc: finishedAt.toISOString(),
    }),
  };
}

const client = db.prepare(`
  SELECT id, name
  FROM api_clients
  WHERE is_active = 1
  ORDER BY created_at ASC
  LIMIT 1
`).get();

const insertStmt = db.prepare(`
  INSERT INTO show_logs (
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

const tx = db.transaction((rows) => {
  for (const row of rows) {
    insertStmt.run(
      row.id,
      row.schemaVersion,
      row.sourceClientId,
      row.sourceClientName,
      row.showNumber,
      row.socketConnections,
      row.movieTitle,
      row.moviePath,
      row.movieId,
      row.startedAtUtc,
      row.finishedAtUtc,
      row.durationMinutes,
      row.clientTimezone,
      row.clientUtcOffsetMinutes,
      row.receivedAtUtc,
      row.rawPayload
    );
  }
});

const rows = Array.from({ length: count }, (_, i) => buildFakeLog(i, client));

tx(rows);

console.log(`Inserted ${rows.length} test logs.`);
if (client) {
  console.log(`Client used: ${client.name} (${client.id})`);
} else {
  console.log("No api_client found. Logs were inserted without source_client_id.");
}