import axios from "axios";

const client = axios.create({
  baseURL: `${import.meta.env.BASE_URL}api`,
  timeout: 180_000, // 3 minutes — DNA analysis can take time
  headers: { "Content-Type": "application/json" },
});

export default client;
