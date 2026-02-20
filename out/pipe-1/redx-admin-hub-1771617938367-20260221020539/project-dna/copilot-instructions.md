# GitHub Copilot Instructions for RedX Admin Hub

---

## applyTo: '**'

This file serves as the authoritative guide for AI coding assistants working on the RedX Admin Hub project. It provides comprehensive instructions on the project's architecture, code style, state management, component patterns, API integration, and more. AI coding assistants should use this document to ensure that any code generated is consistent with the project's established conventions and patterns.

## Project Overview

The RedX Admin Hub is a web application designed for administrative users of the RedX platform. Its primary purpose is to manage and oversee various operational aspects of the RedX service, including parcel tracking and user authentication. The application is built using React and TypeScript, with a focus on providing a responsive and user-friendly interface. The primary users are administrative staff who require access to detailed operational data and management tools. The project operates within the logistics and delivery business domain, supporting functionalities such as parcel management and user authentication.

## Architecture & Technology Stack

### Core Technologies

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Ant Design**: A UI library for building rich user interfaces.
- **Emotion**: A library for writing CSS styles with JavaScript.
- **Redux Toolkit**: A library for managing application state.
- **Axios**: A promise-based HTTP client for the browser and Node.js.

### Project Structure

```plaintext
.
├── .gitignore
├── bun.lockb
├── components.json
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── public
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
└── src
    ├── assets
    │   └── globalStyles.ts
    ├── components
    │   ├── authorize
    │   │   └── Authorize.tsx
    │   ├── layout
    │   │   └── AppLayout.tsx
    │   ├── table
    │   │   └── TableRenderer.tsx
    │   └── ui
    │       ├── accordion.tsx
    │       ├── alert-dialog.tsx
    │       ├── alert.tsx
    │       ├── aspect-ratio.tsx
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── breadcrumb.tsx
    │       ├── button.tsx
    │       ├── calendar.tsx
    │       ├── card.tsx
    │       ├── carousel.tsx
    │       ├── chart.tsx
    │       ├── checkbox.tsx
    │       ├── collapsible.tsx
    │       ├── command.tsx
    │       ├── context-menu.tsx
    │       ├── dialog.tsx
    │       ├── drawer.tsx
    │       ├── dropdown-menu.tsx
    │       ├── form.tsx
    │       ├── hover-card.tsx
    │       ├── input-otp.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── menubar.tsx
    │       ├── navigation-menu.tsx
    │       ├── pagination.tsx
    │       ├── popover.tsx
    │       ├── progress.tsx
    │       ├── radio-group.tsx
    │       ├── resizable.tsx
    │       ├── scroll-area.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── sheet.tsx
    │       ├── sidebar.tsx
    │       ├── skeleton.tsx
    │       ├── slider.tsx
    │       ├── sonner.tsx
    │       ├── switch.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── textarea.tsx
    │       ├── toast.tsx
    │       ├── toaster.tsx
    │       ├── toggle-group.tsx
    │       ├── toggle.tsx
    │       └── tooltip.tsx
    ├── config
    │   ├── getPagePermissions.ts
    │   ├── local.ts
    │   └── navigation.ts
    ├── hooks
    │   ├── use-mobile.tsx
    │   ├── use-toast.ts
    │   ├── useAuthorization.ts
    │   └── useTable.ts
    ├── lib
    │   ├── formHelpers.ts
    │   └── utils.ts
    ├── pages
    │   ├── Index.tsx
    │   ├── Login.tsx
    │   ├── NotFound.tsx
    │   └── Parcels.tsx
    ├── redux
    │   ├── slices
    │   │   └── AuthSlice.ts
    │   └── store.ts
    ├── services
    │   ├── authAPI.ts
    │   ├── axios.config.ts
    │   └── parcelAPI.ts
    ├── test
    │   ├── example.test.ts
    │   └── setup.ts
    ├── types
    │   ├── auth.ts
    │   └── parcel.ts
    ├── App.css
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    └── vite-env.d.ts
```

## Code Style & Standards

### Formatting & Linting

The project does not have Prettier or ESLint configurations present, and there is no commitlint configuration. However, the TypeScript configuration is set up with the following options:

```json
{
  "strict": false,
  "jsx": null,
  "baseUrl": ".",
  "pathAliases": {
    "@/*": [
      "./src/*"
    ]
  }
}
```

### Import Organization

The preferred import order is as follows: framework → UI library → third-party → local hooks → redux/state → services → constants → types. Here is an annotated example:

```typescript
// Framework imports
import React, { useState, useCallback } from 'react';

// UI library imports
import { Input, Select, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

// Third-party imports
import { css } from '@emotion/react';

// Local hooks
import { useTable } from '@/hooks/useTable';

// Redux/state imports
import { setUser } from '@/redux/slices/AuthSlice';

// Services
import { fetchParcels } from '@/services/parcelAPI';

// Constants
import { ParcelStatus } from '@/types/parcel';

// Types
import type { ColumnsType } from 'antd/es/table';
```

## State Management

### Redux Toolkit

The project uses Redux Toolkit for state management. The configuration and setup are as follows:

#### Store Configuration

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';
import persistedReducer from './reducers';

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
        ],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### Auth Slice Example

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '@/types/auth';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
```

### Typed Hooks

Typed hooks such as `useAppDispatch` and `useAppSelector` are not used in this project. Instead, direct usage of `useDispatch` and `useSelector` is observed.

## Component Patterns

### Page Structure with Authorization

The `Parcels` page demonstrates the use of authorization components:

```typescript
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useCallback } from 'react';
import {
  Input,
  Select,
  Button,
  Tag,
  Space,
  Modal,
  Typography,
  message,
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import Authorize from '@/components/authorize/Authorize';
import AppLayout from '@/components/layout/AppLayout';
import TableRenderer from '@/components/table/TableRenderer';
import { useTable } from '@/hooks/useTable';
import { fetchParcels } from '@/services/parcelAPI';
import { Parcel, FetchParcelsParams } from '@/types/parcel';

const { Title, Text } = Typography;

const searchBarStyle = css`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
```

### Permission-Based Conditional Rendering

The `useAuthorization` hook is used for permission-based rendering:

```typescript
export const useAuthorization = ({
  roles,
}: UseAuthorizationProps): {
  isAuthorized: boolean;
  isAuthenticated: boolean;
} => {
  const auth = useSelector((state: RootState) => state.auth);

  if (!auth.isAuthenticated || !auth.user) {
    return { isAuthorized: false, isAuthenticated: false };
  }

  const userRoleNames = auth.user.roles.map((r) => r.name);
  const isAuthorized = roles.some((role) =>
    userRoleNames.includes(role),
  );

  return { isAuthorized, isAuthenticated: true };
};
```

### Primary Form Handling Pattern

The project uses Ant Design's `Form` component for form handling:

```typescript
import { Form, Input, Button, message } from 'antd';
import { useDispatch } from 'react-redux';
import { setUser } from '@/redux/slices/AuthSlice';
import { requestLoginOtp, verifyOtp } from '@/services/authAPI';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const handleSendOtp = async () => {
    try {
      const phone = form.getFieldValue('phone');
      if (!phone) {
        message.error('Please enter phone number');
        return;
      }
      setLoading(true);
      await requestLoginOtp({ phone });
      message.success('OTP sent successfully!');
      setOtpSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const res = await verifyOtp({
        phone: values.phone,
        otp: values.otp,
      });
      if (res.success && res.user) {
        dispatch(setUser(res.user));
        message.success('Login successful!');
      } else {
        message.error(res.error || 'Login failed');
      }
    } catch {
      // validation error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" size="large">
      <Form.Item
        name="phone"
        label="Phone Number"
        rules={[{ required: true, message: 'Phone is required' }]}
      >
        <Input placeholder="01XXXXXXXXX" />
      </Form.Item>
      <Form.Item
        name="otp"
        label="OTP"
        rules={[{ required: true, message: 'OTP is required' }]}
      >
        <Input />
      </Form.Item>
      <Button type="primary" onClick={handleSendOtp} loading={loading}>
        Send OTP
      </Button>
      <Button type="primary" onClick={handleLogin} loading={loading}>
        Login
      </Button>
    </Form>
  );
};
```

### Table/Data-Grid Pattern

The `useTable` hook is used for managing table data:

```typescript
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
  }, [params, fetchFn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onPaginationChange = (page: number, pageSize: number) => {
    setParams((prev) => ({
      ...prev,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    }));
  };

  const onSearch = (searchParams: Partial<P>) => {
    setParams((prev) => ({
      ...prev,
      ...searchParams,
      offset: 0,
    }));
  };

  const onReset = () => {
    setParams(initialParams);
  };

  const updateRow = (
    predicate: (item: T) => boolean,
    updater: (item: T) => T,
  ) => {
    setData((prev) =>
      prev.map((item) => (predicate(item) ? updater(item) : item)),
    );
  };

  return {
    data,
    total,
    loading,
    params,
    onPaginationChange,
    onSearch,
    onReset,
    updateRow,
  };
};
```

### Styling Approach

The project uses Emotion for styling, as demonstrated in the `globalStyles.ts` file:

```typescript
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

## API Integration

### HTTP Client Configuration

The project uses Axios for HTTP requests. The configuration is as follows:

```typescript
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

### Service Layer Pattern

The canonical service module shape is demonstrated in the `authAPI.ts` file:

```typescript
export const requestLoginOtp = async (
  _data: OtpRequest,
): Promise<{ success: boolean }> => {
  await new Promise((r) => setTimeout(r, 500));
  return { success: true };
};

export const verifyOtp = async (
  data: LoginPayload,
): Promise<{ success: boolean; user?: User; error?: string }> => {
  await new Promise((r) => setTimeout(r, 500));
  if (data.otp === '123456') {
    return {
      success: true,
      user: {
        phone: data.phone,
        roles: [{ name: 'RedX Super Admin' }],
      },
    };
  }
  return { success: false, error: 'Invalid OTP' };
};
```

### Error Handling

The project uses Ant Design's `message` component for user feedback in error handling:

```typescript
try {
  const values = await form.validateFields();
  setLoading(true);
  const res = await verifyOtp({
    phone: values.phone,
    otp: values.otp,
  });
  if (res.success && res.user) {
    dispatch(setUser(res.user));
    message.success('Login successful!');
  } else {
    message.error(res.error || 'Login failed');
  }
} catch {
  message.error('Validation error');
} finally {
  setLoading(false);
}
```

## Navigation & Routing

The project uses React Router for navigation and routing. The configuration is as follows:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Parcels from './pages/Parcels';
import NotFound from './pages/NotFound';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/parcels" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/parcels" element={<Parcels />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);
```

### Menu/Navigation Configuration

The navigation configuration is defined in `navigation.ts`:

```typescript
export interface NavItem {
  key: string;
  label: string;
  path: string;
  roles: string[];
}

export const navigationItems: NavItem[] = [
  {
    key: 'parcels',
    label: 'Parcels',
    path: '/parcels',
    roles: ['RedX Super Admin', 'RedX Finance Team'],
  },
];
```

## Authentication & Authorization

### Authentication Flow

The authentication flow involves sending an OTP to the user's phone and verifying it:

1. User enters their phone number.
2. An OTP is sent to the phone number.
3. User enters the OTP.
4. The OTP is verified, and the user is authenticated.

### Hook-Based Authorization

The `useAuthorization` hook is used to check user roles and permissions:

```typescript
export const useAuthorization = ({
  roles,
}: UseAuthorizationProps): {
  isAuthorized: boolean;
  isAuthenticated: boolean;
} => {
  const auth = useSelector((state: RootState) => state.auth);

  if (!auth.isAuthenticated || !auth.user) {
    return { isAuthorized: false, isAuthenticated: false };
  }

  const userRoleNames = auth.user.roles.map((r) => r.name);
  const isAuthorized = roles.some((role) =>
    userRoleNames.includes(role),
  );

  return { isAuthorized, isAuthenticated: true };
};
```

## Common Utilities

### Form Helpers

The `formHelpers.ts` file contains utility functions for form handling:

```typescript
export const handleNumericValueChange = (
  value: string,
): string => {
  return value.replace(/[^0-9]/g, '');
};

export const disableFutureDates = (current: Dayjs): boolean => {
  return current && current.valueOf() > Date.now();
};
```

### Utility Functions

The `utils.ts` file contains utility functions for class name merging:

```typescript
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Testing & Quality

### Testing Framework

The project uses Vitest for testing, with the configuration defined in `vitest.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### Test-ID Conventions

The project uses `data-testid` attributes for testing, as seen in the `Login.tsx` file:

```typescript
<Form.Item
  name="phone"
  label="Phone Number"
  rules={[{ required: true, message: 'Phone is required' }]}
>
  <Input data-testid="phone-input" placeholder="01XXXXXXXXX" />
</Form.Item>
```

## Environment Variables

The project does not specify any required environment variables in the provided data.

## Development Workflow

### Local Development

To set up the project locally, use the following commands:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build the project
npm run build

# Start the production server
npm start
```

### Local Setup Requirements

- Node.js version: 14.x or higher
- Package manager: npm
- External services: None specified

### Git Workflow

The project does not specify a conventional commits format, branch naming convention, or CI/CD pipeline details.

## Performance Considerations

The project does not specify any code splitting strategy, lazy loading, tree-shaking setup, or bundle analysis tools.

## Common Patterns to Follow

1. Use Emotion for styling components.
2. Use Ant Design components for consistent UI patterns.
3. Wrap route content with `Authorize` where access control is required.
4. Use `useTable` hook for managing table data.
5. Use `useAuthorization` hook for permission-based rendering.
6. Use `axios` for HTTP requests with a centralized configuration.
7. Use Redux Toolkit for state management.
8. Use `data-testid` attributes for testing.
9. Use `Form` component from Ant Design for form handling.
10. Use `message` component from Ant Design for user feedback.
11. Use `useDispatch` and `useSelector` for accessing Redux state.
12. Use TypeScript for type safety and improved developer experience.

## Domain-Specific Features

### Parcel Management

- **Purpose**: Manage and track parcels within the RedX platform.
- **Key Components**: `Parcels.tsx`, `TableRenderer.tsx`
- **Special Patterns**: Use of `useTable` hook for data management and `Authorize` component for access control.

### User Authentication

- **Purpose**: Authenticate users via OTP.
- **Key Components**: `Login.tsx`, `authAPI.ts`
- **Special Patterns**: OTP-based authentication flow with Redux state management.

## Debugging & Development Tools

The project does not specify any DevTools integration or logging patterns.

## Migration Notes

No ongoing migrations are detected in the project.

## Best Practices

1. Use design tokens for consistent theming.
2. Avoid direct use of hex colors; use design tokens instead.
3. Use `useCallback` and `useMemo` for performance optimization.
4. Keep components small and focused on a single responsibility.
5. Use TypeScript interfaces and types for defining data structures.
6. Use `async/await` for handling asynchronous operations.
7. Use `try/catch` blocks for error handling in asynchronous functions.
8. Use `useEffect` for side effects in functional components.
9. Use `useState` for managing local component state.
10. Use `useReducer` for complex state management scenarios.

Remember: The RedX Admin Hub is designed to streamline administrative tasks and enhance operational efficiency within the RedX platform.