import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getLogById } from "../lib/api";

export default function LogDetailsPage() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getLogById(id);
        setItem(data);
      } catch (err) {
        setError(err?.data?.error || "Не удалось загрузить запись");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="page-shell">
      <div className="details-topbar">
        <Link to="/logs" className="secondary-btn link-btn">
          ← Назад к логам
        </Link>
      </div>

      {loading ? <div className="centered padded">Загрузка...</div> : null}
      {error ? <div className="error-box">{error}</div> : null}

      {!loading && !error && item ? (
        <div className="details-card">
          <h1>Запись лога</h1>

          <div className="details-grid">
            <Detail label="ID" value={item.id} />
            <Detail label="Schema version" value={item.schema_version} />
            <Detail label="Клиент ID" value={item.source_client_id} />
            <Detail label="Клиент" value={item.source_client_name} />
            <Detail label="№ показа" value={item.show_number} />
            <Detail label="Подключения" value={item.socket_connections} />
            <Detail label="Время показа" value={`${item.duration_minutes} мин`} />
            <Detail label="Название фильма" value={item.movie_title} />
            <Detail label="Movie path" value={item.movie_path} />
            <Detail label="Movie id" value={item.movie_id} />
            <Detail label="Начало" value={formatDate(item.started_at_utc)} />
            <Detail label="Окончание" value={formatDate(item.finished_at_utc)} />
            <Detail label="Timezone" value={item.client_timezone} />
            <Detail label="UTC offset" value={item.client_utc_offset_minutes} />
            <Detail label="Получено сервером" value={formatDate(item.received_at_utc)} />
          </div>

          <h2>Raw payload</h2>
          <pre className="raw-block">
            {prettyJson(item.raw_payload)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value ?? "-"}</div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU");
}

function prettyJson(raw) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw || "";
  }
}