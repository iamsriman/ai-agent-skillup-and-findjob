export const TOKEN_STORAGE_KEY = "skillmap_access_token";
const USER_STORAGE_KEY = "skillmap_user";
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

let unauthorizedHandler = () => {};

export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {} } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function storeAuth({ access_token, user }) {
  localStorage.setItem(TOKEN_STORAGE_KEY, access_token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function readStoredAuth() {
  const accessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  const serializedUser = localStorage.getItem(USER_STORAGE_KEY);
  let user = null;

  if (serializedUser) {
    try {
      user = JSON.parse(serializedUser);
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  return { accessToken, user };
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

function validationDetails(detail) {
  if (!Array.isArray(detail)) return {};

  return detail.reduce((errors, item) => {
    if (!item || typeof item.msg !== "string") return errors;
    const field = Array.isArray(item.loc) ? item.loc.at(-1) : "form";
    if (typeof field === "string") errors[field] = item.msg;
    return errors;
  }, {});
}

function messageForStatus(status, detail) {
  if (status === 400 || status === 422) {
    return typeof detail === "string" ? detail : "Check the highlighted fields.";
  }
  if (status === 404) return "Conversation not found.";
  if (status === 502) return "The assistant had trouble responding. Try again.";
  if (status === 504) return "The assistant took too long to respond. Try again.";
  if (status >= 500) return "The server couldn't complete your request. Try again.";
  return typeof detail === "string" ? detail : "The request couldn't be completed.";
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Can't reach the server. Check that the backend is running.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON errors use the same safe, status-based messages below.
  }

  if (response.status === 401 && token) {
    unauthorizedHandler();
  }

  if (!response.ok) {
    const detail = data && typeof data === "object" ? data.detail : undefined;
    throw new ApiError(messageForStatus(response.status, detail), {
      status: response.status,
      fieldErrors: validationDetails(detail),
    });
  }

  return data;
}
