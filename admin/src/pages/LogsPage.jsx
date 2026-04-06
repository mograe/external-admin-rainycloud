import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getClients, getLogs } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const columns = [
  { key: "date", label: "Дата", sortKey: "started_at_utc" },
  { key: "show_number", label: "Номер показа за день", sortKey: "show_number" },
  { key: "movie_title", label: "Название видео", sortKey: "movie_title" },
  { key: "socket_connections", label: "Количество подключений", sortKey: "socket_connections" },
  { key: "show_duration", label: "Длительность показа", sortKey: "finished_at_utc" },
];

export default function LogsPage() {
  const { user, logout } = useAuth();

  const [logs, setLogs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [clientId, setClientId] = useState("");
  const [total, setTotal] = useState(0);

  const [sortBy, setSortBy] = useState("started_at_utc");
  const [sortDir, setSortDir] = useState("desc");

  async function loadLogs({
    nextPage = page,
    q = appliedQuery,
    selectedClientId = clientId,
    nextSortBy = sortBy,
    nextSortDir = sortDir,
  } = {}) {
    setLoading(true);
    setError("");

    try {
      const data = await getLogs({
        page: nextPage,
        pageSize,
        q,
        clientId: selectedClientId,
        sortBy: nextSortBy,
        sortDir: nextSortDir,
      });

      setLogs(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || nextPage);
      setSortBy(data.sortBy || nextSortBy);
      setSortDir(data.sortDir || nextSortDir);
    } catch (err) {
      setError(err?.data?.error || "Не удалось загрузить логи");
    } finally {
      setLoading(false);
    }
  }

  async function loadClients() {
    setLoadingClients(true);
    try {
      const data = await getClients();
      setClients(data.items || []);
    } catch {
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    loadLogs({
      nextPage: 1,
      q: appliedQuery,
      selectedClientId: clientId,
      nextSortBy: sortBy,
      nextSortDir: sortDir,
    });
  }, [appliedQuery, clientId]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function handleSearchSubmit(e) {
    e.preventDefault();
    setAppliedQuery(query);
  }

  function handleSort(column) {
    const nextSortBy = column.sortKey;
    const isSame = sortBy === nextSortBy;
    const nextDir = isSame && sortDir === "asc" ? "desc" : "asc";

    setSortBy(nextSortBy);
    setSortDir(nextDir);

    loadLogs({
      nextPage: 1,
      q: appliedQuery,
      selectedClientId: clientId,
      nextSortBy,
      nextSortDir: nextDir,
    });
  }

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <h1>Логи показов</h1>
          <div className="muted">
            Пользователь: <strong>{user?.username}</strong>
          </div>
        </div>

        <button className="secondary-btn" onClick={handleLogout}>
          Выйти
        </button>
      </header>

      <section className="filters-card">
        <form className="filters-row" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Поиск по названию видео или id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={loadingClients}
          >
            <option value="">Все клиенты</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <button type="submit">Найти</button>
        </form>
      </section>

      {error ? <div className="error-box">{error}</div> : null}

      <section className="table-card">
        {loading ? (
          <div className="centered padded">Загрузка логов...</div>
        ) : logs.length === 0 ? (
          <div className="centered padded">Логи не найдены</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col)}
                      className="sortable-th"
                    >
                      <span>{col.label}</span>
                      <span className="sort-indicator">
                        {sortBy === col.sortKey ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link to={`/logs/${item.id}`} className="table-link">
                        {formatDateOnly(item.started_at_utc)}
                      </Link>
                    </td>
                    <td>{item.show_number ?? "-"}</td>
                    <td>{item.movie_title || "-"}</td>
                    <td>{item.socket_connections ?? 0}</td>
                    <td>{formatDuration(item.started_at_utc, item.finished_at_utc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="pagination">
        <button
          className="secondary-btn"
          disabled={page <= 1 || loading}
          onClick={() =>
            loadLogs({
              nextPage: page - 1,
              q: appliedQuery,
              selectedClientId: clientId,
              nextSortBy: sortBy,
              nextSortDir: sortDir,
            })
          }
        >
          Назад
        </button>

        <span>
          Страница {page} / {totalPages} · Всего: {total}
        </span>

        <button
          className="secondary-btn"
          disabled={page >= totalPages || loading}
          onClick={() =>
            loadLogs({
              nextPage: page + 1,
              q: appliedQuery,
              selectedClientId: clientId,
              nextSortBy: sortBy,
              nextSortDir: sortDir,
            })
          }
        >
          Вперёд
        </button>
      </footer>
    </div>
  );
}

function formatDateOnly(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ru-RU");
}

function formatDuration(startValue, endValue) {
  if (!startValue || !endValue) return "-";

  const start = new Date(startValue);
  const end = new Date(endValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "-";
  }

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return "-";

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} ч ${String(minutes).padStart(2, "0")} мин ${String(seconds).padStart(2, "0")} сек`;
  }

  return `${minutes} мин ${String(seconds).padStart(2, "0")} сек`;
}