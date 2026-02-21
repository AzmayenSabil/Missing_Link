# Authorize Page Example

- File: pages/admin/daraz-reattempt-update.js
- Line range: 1-30

```ts
import React from 'react';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { css, jsx } from '@emotion/react';
import { Button, Col, message, PageHeader, Row, Select, Space, Upload } from 'antd';
import { useCallback, useState } from 'react';
import { Authorize } from '../../components/authorize/Authorize';
import ShopUpLayout from '../../components/ShopUpLayout';
import { Text } from '../../components/Text/Text';
import { googleDocLinks } from '../../config/googleDocLinks';
import { api_base_url as url } from '../../services/axios.config';

const { Option } = Select;

const uploadUrl = `https://${url}/v4/logistics/parcels/bulk-update`;

const UploadBtn = ({ afterUpload, size, type, status }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async ({ file }) => {
    if (file.status === 'uploading') {
      return;
    }

    if (file.status === 'error') {
      setIsUploading(false);
      message.error(file?.response?.message || 'Something went wrong.');
    }

    if (
      file.status === 'done' &&
```
