import { apiRequest } from "./client.js";

export function register({ name, email, password }) {
  return apiRequest("/api/register", {
    method: "POST",
    body: JSON.stringify({ name: name || null, email, password }),
  });
}

export function login({ email, password }) {
  return apiRequest("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
