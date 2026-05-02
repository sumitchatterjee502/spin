import axios from "axios";

/**
 * Backend HTTP client for campaign/product modules.
 * Defaults match existing app API (`NEXT_PUBLIC_API_URL` or `http://localhost:3000/api`).
 * For a server without `/api`, set `NEXT_PUBLIC_API_URL` to `http://localhost:3000`.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
