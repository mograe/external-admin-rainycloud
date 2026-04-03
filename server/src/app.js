import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";

import "./db.js";
import adminAuthRoutes from "./routes/adminAuth.routes.js";
import adminLogsRoutes from "./routes/adminLogs.routes.js";
import ingestRoutes from "./routes/ingest.routes.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json({limit: "2mb"}));
app.use(cookieParser());


app.use(cors({
    origin: true,
    credentials: true
}));

app.get("/health", (_req, res) => {
    res.json({ok:true});
})

app.use("/admin/api", adminAuthRoutes);
app.use("/admin/api", adminLogsRoutes);
app.use("/api/v1/ingest", ingestRoutes);

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});