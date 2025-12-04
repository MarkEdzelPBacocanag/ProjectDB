const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4100/api";

async function req(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    try {
      const err = JSON.parse(text);
      throw new Error(err.message || res.statusText);
    } catch {
      throw new Error(text || res.statusText);
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const API = {
  login: (username, password) =>
    req("/users/login", { method: "POST", body: { username, password } }),
  users: {
    registerStaff: (token, { username, password, staffId }) =>
      req("/users/register", {
        method: "POST",
        token,
        body: { username, password, role: "staff", staffId },
      }),
    updateStaffPassword: (token, staffId, newPassword) =>
      req(`/users/staff/${staffId}/password`, {
        method: "PUT",
        token,
        body: { newPassword },
      }),
  },
  residents: {
    list: () => req("/residents"),
    create: (token, data) =>
      req("/residents", { method: "POST", token, body: data }),
    update: (token, id, data) =>
      req(`/residents/${id}`, { method: "PUT", token, body: data }),
    remove: (token, id) => req(`/residents/${id}`, { method: "DELETE", token }),
  },
  services: {
    list: () => req("/services"),
    create: (token, data) =>
      req("/services", { method: "POST", token, body: data }),
    update: (token, id, data) =>
      req(`/services/${id}`, { method: "PUT", token, body: data }),
    remove: (token, id) => req(`/services/${id}`, { method: "DELETE", token }),
  },
  requests: {
    list: () => req("/requests"),
    create: (token, data) =>
      req("/requests", { method: "POST", token, body: data }),
    update: (token, id, data) =>
      req(`/requests/${id}`, { method: "PUT", token, body: data }),
    remove: (token, id) => req(`/requests/${id}`, { method: "DELETE", token }),
  },
  assignments: {
    list: () => req("/assignments"),
    create: (token, data) =>
      req("/assignments", { method: "POST", token, body: data }),
    remove: (token, id) =>
      req(`/assignments/${id}`, { method: "DELETE", token }),
  },
  staff: {
    list: () => req("/staff"),
    create: (token, data) =>
      req("/staff", { method: "POST", token, body: data }),
    update: (token, id, data) =>
      req(`/staff/${id}`, { method: "PUT", token, body: data }),
    remove: (token, id) => req(`/staff/${id}`, { method: "DELETE", token }),
  },
};
