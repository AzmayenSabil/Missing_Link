# Service Layer Example

- File: src/services/axios.config.ts
- Line range: 1-12

```ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://dummy-api.redx.local',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;

```
