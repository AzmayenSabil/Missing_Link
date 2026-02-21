# GitHub Copilot Instructions for RedX Admin Hub

---

## applyTo: '**'

This file serves as the authoritative guide for AI coding assistants working on the RedX Admin Hub project. It provides comprehensive instructions and conventions that must be followed to ensure consistency and quality across the codebase. AI coding assistants should use this document as the primary reference for understanding the project's architecture, coding standards, and development practices.

## Project Overview

The RedX Admin Hub is a web application designed to manage and oversee parcel deliveries within the RedX logistics network. Its primary users include administrators and finance team members who require access to parcel tracking, user management, and reporting features. The project operates within the logistics and delivery business domain, focusing on efficient parcel management and user authentication. The codebase consists of 99 files, predominantly written in TypeScript, and leverages React for the frontend interface.

## Architecture & Technology Stack

### Core Technologies

- **React**: The primary library for building the user interface.
- **TypeScript**: Used for type safety and enhanced code quality.
- **Ant Design**: Version unspecified, used for UI components.
- **Emotion**: Version unspecified, used for CSS-in-JS styling.
- **Redux Toolkit**: Version unspecified, used for state management.
- **Axios**: Version unspecified, used for HTTP requests.

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

- **Prettier**: Not present in the project.
- **ESLint**: Not present in the project.
- **Commitlint**: Not present in the project.
- **File Naming**: Uses camelCase for files and PascalCase for components.
- **TypeScript Config**: 

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

Preferred import order:

1. Framework imports
2. UI library imports
3. Third-party imports
4. Local hooks
5. Redux/state imports
6. Services
7. Constants
8. Types

Example:

```typescript
import React, { useState, useEffect } from 'react'; // Framework
import { Button, Input } from 'antd'; // UI library
import axios from 'axios'; // Third-party
import { useTable } from '@/hooks/useTable'; // Local hooks
import { setUser } from '@/redux/slices/AuthSlice'; // Redux/state
import { fetchParcels } from '@/services/parcelAPI'; // Services
import { Parcel } from '@/types/parcel'; // Types
```

## State Management

### Redux Toolkit

- **Configuration / Setup Snippet**:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/AuthSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});
```

- **Full Pattern Example**:

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

- **Typed Hooks Pattern**: Not detected in this project.

- **Usage Example**:

```typescript
import { useDispatch } from 'react-redux';
import { setUser } from '@/redux/slices/AuthSlice';

const dispatch = useDispatch();
dispatch(setUser({ phone: '1234567890', roles: [{ name: 'Admin' }] }));
```

## Component Patterns

### Page Structure with Authorization

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
```

### Permission-Based Conditional Rendering

```typescript
import { useAuthorization } from '@/hooks/useAuthorization';

const { isAuthorized } = useAuthorization({ roles: ['Admin'] });

if (isAuthorized) {
  return <AdminPanel />;
} else {
  return <UnauthorizedMessage />;
}
```

### Primary Form Handling Pattern

```typescript
import { Form, Input, Button, message } from 'antd';

const LoginForm = () => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Handle login logic
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

### Secondary Form Pattern

Not detected in this project.

### Table / Data-Grid Pattern

```typescript
import { Table } from 'antd';
import { useTable } from '@/hooks/useTable';
import { fetchParcels } from '@/services/parcelAPI';
import { Parcel, FetchParcelsParams } from '@/types/parcel';

const ParcelsTable = () => {
  const { data, total, loading, onPaginationChange } = useTable<Parcel, FetchParcelsParams>({
    initialParams: { limit: 10, offset: 0 },
    fetchFn: fetchParcels,
  });

  const columns = [
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
  ];

  return <Table columns={columns} dataSource={data} loading={loading} pagination={{ total }} />;
};
```

### Styling Approach

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

### Other Recurring Component Patterns

Not detected in this project.

## API Integration

### HTTP Client Configuration

- **Axios Instance**:

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

```typescript
import apiClient from './axios.config';

export const fetchParcels = async (params: FetchParcelsParams): Promise<FetchParcelsResponse> => {
  const response = await apiClient.get('/parcels', { params });
  return response.data;
};
```

### Error Handling

```typescript
try {
  const response = await apiClient.get('/endpoint');
  // Handle response
} catch (error) {
  message.error('An error occurred');
}
```

## Navigation & Routing

### Routing Approach

The project uses React Router for navigation.

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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

### Menu / Navigation Configuration

```typescript
export const navigationItems: NavItem[] = [
  {
    key: 'parcels',
    label: 'Parcels',
    path: '/parcels',
    roles: ['RedX Super Admin', 'RedX Finance Team'],
  },
];
```

### Page-Level Permissions Configuration

```typescript
export const getPagePermissions = (path: string): string[] => {
  return pagePermissions[path] || [];
};
```

## Authentication & Authorization

### Auth Flow

1. User enters phone number and requests OTP.
2. OTP is sent and user enters it for verification.
3. Upon successful verification, user is authenticated and redirected.

### Hook-Based Authorization Pattern

```typescript
export const useAuthorization = ({ roles }: UseAuthorizationProps): { isAuthorized: boolean; isAuthenticated: boolean } => {
  const auth = useSelector((state: RootState) => state.auth);

  if (!auth.isAuthenticated || !auth.user) {
    return { isAuthorized: false, isAuthenticated: false };
  }

  const userRoleNames = auth.user.roles.map((r) => r.name);
  const isAuthorized = roles.some((role) => userRoleNames.includes(role));

  return { isAuthorized, isAuthenticated: true };
};
```

### Role/Permission Constants

```typescript
export interface Role {
  name: string;
}
```

## Common Utilities

### Form Helpers

```typescript
export const handleNumericValueChange = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};
```

### Utility Functions

```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Testing & Quality

### Testing Framework

The project uses Vitest for testing.

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

### Test-ID Conventions

Not explicitly defined in the project.

### Lint / Test / Type-Check Commands

```bash
# Run tests
vitest

# Type-check
tsc --noEmit
```

## Environment Variables

```bash
# Example .env file
API_BASE_URL=https://dummy-api.redx.local
```

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Local Setup Requirements

- Node.js version: Unspecified
- Package manager: npm
- External services: None specified

### Git Workflow

- **Branch Naming**: Not specified
- **PR Review Requirements**: Not specified
- **CI/CD Pipeline**: Not specified

## Performance Considerations

### Code Splitting Strategy

Not explicitly defined in the project.

### Lazy Loading

Not explicitly defined in the project.

### Tree-Shaking Setup

Not explicitly defined in the project.

### Bundle Analysis Tools

Not explicitly defined in the project.

## Common Patterns to Follow

1. Use design tokens for colors instead of hex values.
2. Wrap route content with `Authorize` for access control.
3. Prefer Ant Design components for UI consistency.
4. Use `useTable` hook for table data management.
5. Implement error handling with `try/catch` and user feedback.
6. Use `useAuthorization` hook for role-based access control.
7. Organize imports in the specified order.
8. Use `axios` for HTTP requests with a centralized configuration.
9. Follow TypeScript conventions for type safety.
10. Use `reduxToolkit` for state management.
11. Implement form handling with Ant Design's `Form` component.
12. Use `emotion` for styling with CSS-in-JS.

## Domain-Specific Features

### Parcel Management

- **Purpose**: Manage and track parcel deliveries.
- **Key Components**: `Parcels.tsx`, `TableRenderer.tsx`
- **Special Patterns**: Use of `useTable` hook for data fetching and pagination.

## Debugging & Development Tools

### DevTools Integration

- **Redux DevTools**: Not explicitly mentioned but can be integrated.
- **React DevTools**: Standard for React applications.

### Logging Patterns

```typescript
useEffect(() => {
  console.error('404 Error: User attempted to access non-existent route:', location.pathname);
}, [location.pathname]);
```

### Source Maps

Not explicitly defined in the project.

## Migration Notes

No ongoing migrations detected in the project.

## Best Practices

1. Always use design tokens for styling.
2. Ensure all routes requiring authentication are wrapped with `Authorize`.
3. Use `useTable` for managing table data and pagination.
4. Centralize API configurations in `axios.config.ts`.
5. Use `reduxToolkit` for state management to ensure consistency.
6. Implement error handling with user feedback mechanisms.
7. Follow TypeScript conventions for type safety.
8. Use `emotion` for styling to maintain consistency.
9. Organize imports according to the specified order.
10. Use Ant Design components for a consistent UI experience.

Remember: The RedX Admin Hub is designed to efficiently manage parcel deliveries within the RedX logistics network.