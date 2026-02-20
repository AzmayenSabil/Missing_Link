# Authorize Page Example

- File: src/pages/Parcels.tsx
- Line range: 1-30

```ts
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
