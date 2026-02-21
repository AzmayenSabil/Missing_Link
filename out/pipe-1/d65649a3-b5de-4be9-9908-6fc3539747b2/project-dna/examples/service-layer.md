# Service Layer Example

- File: services/adjustmentsApi.js
- Line range: 1-25

```ts
import ax from './axios.config';

const addAdjustments = async ({ amount, shopId, parcelTrackingId, reason, comment }) => {
  try {
    return await ax.post(`/v4/logistics/adjustments`, {
      amount,
      shopId,
      parcelTrackingId,
      reason,
      comment,
    });
  } catch (err) {
    return err.response.data;
  }
};

const fetchInvoices = async ({ parcelTrackingId }) => {
  return await ax.get(`/v4/logistics/adjustments/parcels/${parcelTrackingId}`);
};

export default {
  addAdjustments,
  fetchInvoices,
};

```
