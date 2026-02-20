/**
 * Axios instance configured for the pipe-3-v2 server.
 */

import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 180_000, // 3 min (two OpenAI calls)
  headers: { "Content-Type": "application/json" },
});

export default apiClient;
