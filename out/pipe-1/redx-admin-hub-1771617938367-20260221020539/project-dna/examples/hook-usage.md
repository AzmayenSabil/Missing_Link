# Hook Usage Example

- File: src/hooks/useTable.ts
- Line range: 1-30

```ts
import { useState, useEffect, useCallback } from 'react';

interface UseTableParams {
  limit: number;
  offset: number;
}

interface UseTableOptions<T, P extends UseTableParams> {
  initialParams: P;
  fetchFn: (params: P) => Promise<{ results: T[]; count: number }>;
}

export const useTable = <T, P extends UseTableParams>({
  initialParams,
  fetchFn,
}: UseTableOptions<T, P>) => {
  const [params, setParams] = useState<P>(initialParams);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFn(params);
      setData(res.results);
      setTotal(res.count);
    } finally {
      setLoading(false);
    }
```
