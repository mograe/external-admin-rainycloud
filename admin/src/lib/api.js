export async function apiFetch(path, options = {}) {
    const response = await fetch(path, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options
    });

    let data = null;
    const contentType = response.headers.get('content-type') || "";
    
    if (contentType.includes('application/json')) {
        data = await response.json();
    } else {
        const text = await response.text();
        data = text;
    }

    if (!response.ok) {
        const error = new Error(data?.error || "REQUEST_FAILED");
        error.status = response.status;
        error.data = data;
        throw error;
    }
     
    return data;
}

export function loginRequest(payload) {
    return apiFetch('/admin/api/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function logoutRequest() {
    return apiFetch('/admin/api/logout', {
        method: 'POST',
    });
}

export function meRequest() {
    return apiFetch('/admin/api/me');
}

export function getLogs(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  return apiFetch(`/admin/api/logs?${search.toString()}`);
}

export function getLogById(id) {
    return apiFetch(`/admin/api/logs/${id}`);
}

export function getClients() {
    return apiFetch('/admin/api/clients');
}