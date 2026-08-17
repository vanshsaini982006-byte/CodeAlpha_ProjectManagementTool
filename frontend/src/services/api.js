import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

// Session persists in localStorage when "Remember me" is checked, otherwise
// in sessionStorage (cleared when the tab closes). Both are checked on read
// so either path works transparently.
export const getStoredToken = () =>
  localStorage.getItem('taskflow_token') || sessionStorage.getItem('taskflow_token');

export const getStoredUser = () => {
  const raw = localStorage.getItem('taskflow_user') || sessionStorage.getItem('taskflow_user');
  return raw ? JSON.parse(raw) : null;
};

export const clearStoredSession = () => {
  localStorage.removeItem('taskflow_token');
  localStorage.removeItem('taskflow_user');
  sessionStorage.removeItem('taskflow_token');
  sessionStorage.removeItem('taskflow_user');
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredSession();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (err) => {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.message === 'Network Error') return 'Cannot reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
};

export default api;
