# Hook Usage Example

- File: hooks/useTable.tsx
- Line range: 24-53

```ts
export interface CommonParametersType {
  limit: number;
  offset: number;
}

interface StateTypes<DataType, ParametersType> {
  fetching: boolean;
  error: any;
  data: Array<DataType>;
  count: number;
  params: ParametersType;
}

export function useTable<
  ParametersType,
  SuccessResponseType,
  ErrorResponseType,
  DataType
>(props: Props<ParametersType, SuccessResponseType, ErrorResponseType, DataType>) {
  const initialState = {
    fetching: false,
    error: {},
    data: [],
    count: 0,
    params: {
      ...props.initialParameters,
    },
  };

  function reducer(
```
