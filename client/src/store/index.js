import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import bookReducer from './slices/bookSlice';
import transactionReducer from './slices/transactionSlice';
import userReducer from './slices/userSlice';
import adminReducer from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    books: bookReducer,
    transactions: transactionReducer,
    users: userReducer,
    admin: adminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
