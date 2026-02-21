# Redux Slice Example

- File: redux/AdminRecoverySlice.js
- Line range: 20-49

```ts
  adminRecoveryAPI.getDeliveryPartners,
);

const setResponsibleAsync = createAsyncThunk(
  'admin/setResponsible',
  adminRecoveryAPI.setResponsible,
);

const updateAdminIssueStatusAsync = createAsyncThunk(
  'admin/updateAdminIssueStatus',
  adminRecoveryAPI.updateAdminIssueStatus,
);

const AdminRecoverySlice = createSlice({
  name: 'issue',
  initialState,
  reducers: {
    setAdminRecoveryTablePageNumber: (state, action) => {
      state.adminIssueTablePageNumber = action.payload;
    },
    selectIssue: (state, action) => {
      state.selectedIssue = action.payload;
    },
    showResponsibleModal: (state) => {
      state.isResponsibleModal = true;
    },
    hideResponsibleModal: (state) => {
      state.isResponsibleModal = false;
    },
    setAdminStatusLoadingId: (state, action) => {
```
