# Styling Example

- File: src/assets/globalStyles.ts
- Line range: 1-15

```ts
import { css } from '@emotion/react';

export const globalStyles = css`
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
      Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #f5f5f5;
  }

  #root {
    min-height: 100vh;
  }
`;

```
