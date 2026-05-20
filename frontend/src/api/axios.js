/**
 * api/axios.js
 * Configured Axios instance that sends credentials (httpOnly cookies) with every request.
 * withCredentials: true is critical — without it, the browser won't send the auth cookie.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,  // sends httpOnly cookie automatically
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: log out if token expires (401)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if session expired (handled in AuthContext)
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
