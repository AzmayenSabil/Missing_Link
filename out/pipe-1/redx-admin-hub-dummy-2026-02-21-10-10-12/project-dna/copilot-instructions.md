# GitHub Copilot Instructions for RedX Admin Hub

---

## applyTo: '**'

This file serves as the authoritative guide for AI coding assistants working on the RedX Admin Hub project. It provides comprehensive instructions and conventions that must be followed to ensure consistency and quality across the codebase. AI coding assistants should use this document as the primary reference for understanding the project's architecture, coding standards, and development practices.

## Project Overview

The RedX Admin Hub is a web-based application designed to manage administrative tasks for the RedX logistics platform. Its primary users are internal staff members, including administrators and finance teams, who require access to parcel tracking, user management, and reporting features. The project is built using React and TypeScript, with a focus on providing a responsive and user-friendly interface. The application leverages Ant Design for UI components and Redux Toolkit for state management, ensuring a scalable and maintainable codebase.

## Architecture & Technology Stack

### Core Technologies

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Ant Design**: A UI library providing a set of high-quality React components.
- **Emotion**: A library for writing CSS styles with JavaScript.
- **Redux Toolkit**: A library for managing application state using Redux.
- **Axios**: A promise-based HTTP client for making requests to the server.

### Project Structure

```plaintext
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
    └── types
        ├── auth.ts
        └── parcel.ts
```

## Code Style & Standards

### Formatting & Linting

The project does not currently use Prettier or ESLint for code formatting and linting. However, TypeScript is configured with the following settings:

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

File naming conventions follow camelCase for files and PascalCase for components. There is no commitlint configuration present.

### Import Organization

The preferred import order is as follows:

1. Framework imports (e.g., React)
2. UI library imports (e.g., Ant Design)
3. Third-party library imports
4. Local hooks
5. Redux/state imports
6. Services
7. Constants
8. Types

Example:

```typescript
import React, { useState } from 'react';
import { Button, Input } from 'antd';
import axios from 'axios';
import { useTable } from '@/hooks/useTable';
import { setUser } from '@/redux/slices/AuthSlice';
import { fetchParcels } from '@/services/parcelAPI';
import { Parcel } from '@/types/parcel';
```

## State Management

The project uses Redux Toolkit for state management.

### Redux Toolkit Configuration

The Redux store is configured in `src/redux/store.ts`:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';
import persistedReducer from './reducers';

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Redux Slice Example

The `auth` slice is defined in `src/redux/slices/AuthSlice.ts`:

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

### Usage Example

```typescript
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setUser } from '@/redux/slices/AuthSlice';

const Component = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogin = (user: User) => {
    dispatch(setUser(user));
  };

  return <div>{user ? `Welcome, ${user.name}` : 'Please log in'}</div>;
};
```

## Component Patterns

### Page Structure

Pages are structured with layout components and authorization guards. For example, the `Parcels` page:

```typescript
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useCallback } from 'react';
import { Input, Select, Button, Tag, Space, Modal, Typography, message } from 'antd';
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
`;

const Parcels = () => {
  // Component logic
};

export default Parcels;
```

### Permission-Based Conditional Rendering

Components like `Authorize` are used to wrap content that requires access control:

```typescript
import Authorize from '@/components/authorize/Authorize';

const ProtectedComponent = () => (
  <Authorize roles={['Admin', 'User']}>
    <div>Protected Content</div>
  </Authorize>
);
```

### Primary Form Handling Pattern

Forms are handled using Ant Design's `Form` component. Example from `src/pages/Login.tsx`:

```typescript
import { Form, Input, Button, message } from 'antd';

const LoginForm = () => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Handle login
    } catch (error) {
      message.error('Validation failed');
    }
  };

  return (
    <Form form={form} layout="vertical">
      <Form.Item name="username" label="Username" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true }]}>
        <Input.Password />
      </Form.Item>
      <Button type="primary" onClick={handleSubmit}>
        Login
      </Button>
    </Form>
  );
};
```

### Table/Data-Grid Pattern

Tables are rendered using custom hooks and components. Example from `src/components/table/TableRenderer.tsx`:

```typescript
import { Table } from 'antd';
import { useTable } from '@/hooks/useTable';
import { Parcel } from '@/types/parcel';

const TableRenderer = () => {
  const { data, loading, onPaginationChange } = useTable<Parcel, FetchParcelsParams>({
    initialParams: { limit: 10, offset: 0 },
    fetchFn: fetchParcels,
  });

  return (
    <Table
      dataSource={data}
      loading={loading}
      pagination={{ onChange: onPaginationChange }}
      // Define columns
    />
  );
};
```

### Styling Approach

The project uses Emotion for styling components. Example from `src/assets/globalStyles.ts`:

```typescript
import { css } from '@emotion/react';

export const globalStyles = css`
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #f5f5f5;
  }

  #root {
    min-height: 100vh;
  }
`;
```

## API Integration

### HTTP Client Configuration

The project uses Axios for HTTP requests. The Axios instance is configured in `src/services/axios.config.ts`:

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

Service modules encapsulate API calls. Example from `src/services/parcelAPI.ts`:

```typescript
import apiClient from './axios.config';
import { FetchParcelsParams, FetchParcelsResponse } from '@/types/parcel';

export const fetchParcels = async (params: FetchParcelsParams): Promise<FetchParcelsResponse> => {
  const response = await apiClient.get('/parcels', { params });
  return response.data;
};
```

### Error Handling

Error handling is typically done using try/catch blocks with user feedback via Ant Design's `message` component:

```typescript
import { message } from 'antd';

const fetchData = async () => {
  try {
    const response = await apiClient.get('/data');
    // Handle response
  } catch (error) {
    message.error('Failed to fetch data');
  }
};
```

## Navigation & Routing

The project uses React Router for navigation. The routing configuration is defined in `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Parcels from '@/pages/Parcels';
import NotFound from '@/pages/NotFound';

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

export default App;
```

### Menu/Navigation Configuration

Navigation items are defined in `src/config/navigation.ts`:

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

The authentication flow involves sending an OTP to the user's phone and verifying it. Example from `src/pages/Login.tsx`:

```typescript
import { useState } from 'react';
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
    <Form form={form} layout="vertical">
      <Form.Item name="phone" label="Phone Number" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="otp" label="OTP" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Button type="primary" onClick={handleSendOtp} loading={loading}>
        Send OTP
      </Button>
      <Button type="primary" onClick={handleLogin} loading={loading} disabled={!otpSent}>
        Login
      </Button>
    </Form>
  );
};

export default Login;
```

### Authorization Patterns

Authorization is handled using hooks and components. Example from `src/hooks/useAuthorization.ts`:

```typescript
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

export const useAuthorization = ({ roles }: { roles: string[] }) => {
  const auth = useSelector((state: RootState) => state.auth);

  if (!auth.isAuthenticated || !auth.user) {
    return { isAuthorized: false, isAuthenticated: false };
  }

  const userRoleNames = auth.user.roles.map((r) => r.name);
  const isAuthorized = roles.some((role) => userRoleNames.includes(role));

  return { isAuthorized, isAuthenticated: true };
};
```

## Common Utilities

### Utility Modules

- **Form Helpers** (`src/lib/formHelpers.ts`)

  ```typescript
  export const handleNumericValueChange = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
  };

  export const disableFutureDates = (current: Dayjs): boolean => {
    return current && current.valueOf() > Date.now();
  };
  ```

- **Utils** (`src/lib/utils.ts`)

  ```typescript
  import { twMerge } from 'tailwind-merge';
  import clsx from 'clsx';

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```

## Testing & Quality

### Testing Framework

The project uses Vitest for testing. The configuration is defined in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

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

Test IDs are used in form inputs for testing purposes:

```typescript
<Form.Item name="phone" label="Phone Number" rules={[{ required: true }]}>
  <Input data-testid="phone-input" />
</Form.Item>
```

### Lint/Test/Type-Check Commands

The project does not have specific linting or type-checking commands configured. Testing can be run using Vitest:

```bash
vitest run
```

## Environment Variables

The project does not specify any required environment variables in the DNA snapshot.

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

- Node.js version: 16.x or higher
- Package manager: npm
- External services: None specified

### Git Workflow

The project does not specify a conventional commits format or branch naming convention. There is no CI/CD pipeline evident in the DNA snapshot.

## Performance Considerations

### Code Splitting

The project does not specify a code splitting strategy in the DNA snapshot.

### Lazy Loading

Lazy loading is not explicitly mentioned in the DNA snapshot.

### Tree Shaking

Tree shaking is not explicitly mentioned in the DNA snapshot.

### Bundle Analysis Tools

Bundle analysis tools are not explicitly mentioned in the DNA snapshot.

## Common Patterns to Follow

1. Use Emotion for styling components.
2. Wrap route content with `Authorize` where access control is required.
3. Prefer Ant Design components for consistent UI patterns.
4. Use `useTable` hook for table data management.
5. Use `apiClient` for all HTTP requests.
6. Define navigation items in `src/config/navigation.ts`.
7. Use `useAuthorization` hook for role-based access control.
8. Handle form submissions using Ant Design's `Form` component.
9. Use `message` component from Ant Design for user feedback.
10. Define Redux slices using `createSlice` from Redux Toolkit.
11. Use `persistStore` for Redux state persistence.
12. Use `useDispatch` and `useSelector` for Redux state management.

## Domain-Specific Features

### Parcel Management

- **Purpose**: Manage parcel tracking and status updates.
- **Key Components**: `Parcels` page, `TableRenderer` component, `useTable` hook.
- **Special Patterns**: Use of `useTable` hook for pagination and data fetching.

## Debugging & Development Tools

### DevTools Integration

- **Redux DevTools**: Not explicitly mentioned, but can be integrated for state debugging.
- **React DevTools**: Can be used for component inspection.

### Logging Patterns

Logging is done using `console.error` for error tracking, as seen in `src/pages/NotFound.tsx`.

### Source Maps

Source maps are not explicitly mentioned in the DNA snapshot.

## Migration Notes

No ongoing migrations are detected in the DNA snapshot.

## Best Practices

1. Use design tokens for consistent theming.
2. Avoid using hex colors directly; use design tokens instead.
3. Ensure all pages are wrapped with `Authorize` where necessary.
4. Use Ant Design components for form handling.
5. Keep API service logic encapsulated in service modules.
6. Use `useCallback` and `useEffect` hooks for performance optimization.
7. Ensure all components are styled using Emotion.
8. Use TypeScript interfaces for type safety.
9. Maintain a consistent import order across files.
10. Use `message` component for consistent user feedback.

Remember: The RedX Admin Hub is designed to streamline administrative tasks for the RedX logistics platform, ensuring efficient parcel management and user access control.