/**
 * Axios instance configured for the pipe-2-v2 server.
 */

import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 120_000, // 2 min (OpenAI calls can be slow)
  headers: { "Content-Type": "application/json" },
});

export default apiClient;
