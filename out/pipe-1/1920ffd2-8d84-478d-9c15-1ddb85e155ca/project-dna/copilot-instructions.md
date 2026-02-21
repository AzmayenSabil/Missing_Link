# GitHub Copilot Instructions for RedX Admin Hub

---

## applyTo: '**'

This file serves as the authoritative guide for AI coding assistants working with the RedX Admin Hub project. It provides comprehensive instructions on the project's architecture, coding standards, state management, component patterns, API integration, and more. AI coding assistants should use this document to ensure consistency and adherence to the project's conventions and best practices.

## Project Overview

The RedX Admin Hub is a web application designed for administrative users of the RedX platform. Its primary purpose is to manage and oversee various operations related to parcel delivery services. The application is built using React and TypeScript, with a focus on providing a robust and user-friendly interface for administrators. The primary users are internal staff members, including super admins and finance team members. The project is medium-scale, with a total of 99 files, and is situated within the logistics and delivery business domain.

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
    └── types
        ├── auth.ts
        └── parcel.ts
```

## Code Style & Standards

### Formatting & Linting

- **Prettier**: Not present in the project.
- **ESLint**: Not present in the project.
- **File Naming**: Uses camelCase for files and PascalCase for components.
- **Commitlint**: Not present in the project.

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
import React, { useState, useEffect } from 'react';
import { Button, Input } from 'antd';
import axios from 'axios';
import { useTable } from '@/hooks/useTable';
import { setUser } from '@/redux/slices/AuthSlice';
import { fetchParcels } from '@/services/parcelAPI';
import { Parcel } from '@/types/parcel';
```

## State Management

### Redux Toolkit

The project uses Redux Toolkit for state management. Below is a configuration snippet for the Redux store:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/AuthSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});
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

Typed hooks such as `useAppDispatch` and `useAppSelector` are not used in this project.

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

  return <div>{user ? `Welcome, ${user.phone}` : 'Please log in'}</div>;
};
```

## Component Patterns

### Page Structure with Authorization

```typescript
import React from 'react';
import Authorize from '@/components/authorize/Authorize';
import AppLayout from '@/components/layout/AppLayout';
import Parcels from '@/pages/Parcels';

const ParcelsPage = () => (
  <Authorize roles={['RedX Super Admin']}>
    <AppLayout>
      <Parcels />
    </AppLayout>
  </Authorize>
);

export default ParcelsPage;
```

### Permission-Based Conditional Rendering

```typescript
import React from 'react';
import { useAuthorization } from '@/hooks/useAuthorization';

const Component = () => {
  const { isAuthorized } = useAuthorization({ roles: ['RedX Super Admin'] });

  return isAuthorized ? <div>Authorized Content</div> : <div>Access Denied</div>;
};
```

### Primary Form Handling Pattern

The project uses Ant Design's Form component for form handling.

```typescript
import React from 'react';
import { Form, Input, Button } from 'antd';

const LoginForm = () => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Success:', values);
    } catch (error) {
      console.log('Failed:', error);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item name="username" label="Username" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true }]}>
        <Input.Password />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;
```

### Table/Data-Grid Pattern

```typescript
import React from 'react';
import { Table, Tag } from 'antd';
import { useTable } from '@/hooks/useTable';
import { fetchParcels } from '@/services/parcelAPI';
import { Parcel } from '@/types/parcel';

const ParcelsTable = () => {
  const { data, loading } = useTable<Parcel>({
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
      render: (status: string) => <Tag>{status}</Tag>,
    },
  ];

  return <Table columns={columns} dataSource={data} loading={loading} />;
};

export default ParcelsTable;
```

### Styling Approach

The project uses Emotion for styling.

```typescript
import { css } from '@emotion/react';

export const containerStyle = css`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
`;

export const cardStyle = css`
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;
```

## API Integration

### HTTP Client Configuration

The project uses Axios for HTTP requests. Below is the configuration for the Axios instance:

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

The project uses Ant Design's message component for error handling.

```typescript
import { message } from 'antd';

const handleError = (error: any) => {
  message.error(error.message || 'An error occurred');
};

try {
  // API call
} catch (error) {
  handleError(error);
}
```

## Navigation & Routing

The project uses React Router for navigation.

```typescript
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from '@/pages/Login';
import Parcels from '@/pages/Parcels';
import NotFound from '@/pages/NotFound';

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Parcels />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Router>
);

export default AppRoutes;
```

### Menu/Navigation Configuration

```typescript
export const navigationItems = [
  {
    key: 'parcels',
    label: 'Parcels',
    path: '/parcels',
    roles: ['RedX Super Admin', 'RedX Finance Team'],
  },
];
```

## Authentication & Authorization

### Auth Flow

1. User enters phone number and requests an OTP.
2. User receives OTP and enters it for verification.
3. On successful verification, user is logged in and redirected to the dashboard.

### Hook-Based Authorization

```typescript
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

export const useAuthorization = ({ roles }: { roles: string[] }) => {
  const auth = useSelector((state: RootState) => state.auth);

  const isAuthorized = roles.some((role) => auth.user?.roles.includes(role));

  return { isAuthorized, isAuthenticated: auth.isAuthenticated };
};
```

## Common Utilities

### Form Helpers

```typescript
export const handleNumericValueChange = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};

export const disableFutureDates = (current: Dayjs): boolean => {
  return current && current.valueOf() > Date.now();
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

```bash
# Run tests
vitest
```

### Test-ID Conventions

Test IDs are used in form inputs for testing purposes.

```typescript
<Input data-testid="phone-input" />
```

## Environment Variables

```bash
# .env.example
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

- Node.js version 16.x
- npm as the package manager

### Git Workflow

- Branch naming: feature/branch-name, bugfix/branch-name
- Conventional commits: Not enforced

## Performance Considerations

- Code splitting and lazy loading are not explicitly configured.
- Tree-shaking is enabled by default with Vite.

## Common Patterns to Follow

1. Use Emotion for styling components.
2. Use Ant Design components for UI consistency.
3. Wrap pages with the `Authorize` component for access control.
4. Use Redux Toolkit for state management.
5. Use Axios for HTTP requests.
6. Use `useTable` hook for table data management.
7. Use `useAuthorization` hook for role-based access control.
8. Use `useToast` hook for notifications.
9. Use TypeScript for type safety.
10. Use React Router for navigation.
11. Use Vitest for testing.
12. Use design tokens for consistent theming.

## Domain-Specific Features

### Parcel Management

- Purpose: Manage parcel delivery operations.
- Key Components: `Parcels`, `TableRenderer`, `Authorize`
- Special Patterns: Use of `useTable` hook for data fetching and pagination.

## Debugging & Development Tools

- Redux DevTools for state inspection.
- React DevTools for component inspection.

## Migration Notes

No ongoing migrations detected.

## Best Practices

1. Use Emotion for all styling needs.
2. Prefer Ant Design components for UI elements.
3. Use Redux Toolkit for managing global state.
4. Use Axios for making HTTP requests.
5. Use `useTable` hook for managing table data.
6. Use `useAuthorization` for role-based access control.
7. Use `useToast` for displaying notifications.
8. Use TypeScript for type safety and clarity.
9. Use React Router for managing application routes.
10. Use Vitest for testing and ensuring code quality.

Remember: The RedX Admin Hub is designed to streamline parcel management for administrative users, ensuring efficient and secure operations.