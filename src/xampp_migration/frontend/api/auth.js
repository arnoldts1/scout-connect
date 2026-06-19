/**
 * api/auth.js  –  replaces base44.auth.*
 */
import { http } from './client';

export const auth = {
  /** Login → stores token, returns user object */
  async login(email, password) {
    const res = await http.post('auth/login', { email, password });
    if (res.token) localStorage.setItem('auth_token', res.token);
    return res.user;
  },

  /** Register new user */
  async register(data) {
    const res = await http.post('auth/register', data);
    if (res.token) localStorage.setItem('auth_token', res.token);
    return res.user;
  },

  /** Get current authenticated user */
  async me() {
    return http.get('auth/me');
  },

  /** Update current user's profile */
  async updateMe(data) {
    return http.patch('auth/me', data);
  },

  /** Logout – clears token */
  async logout(redirectUrl) {
    await http.post('auth/logout').catch(() => {});
    localStorage.removeItem('auth_token');
    window.location.href = redirectUrl ?? '/login';
  },

  /** Returns true if a token exists (lightweight check) */
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  },

  /** Redirect to login page */
  redirectToLogin(nextUrl) {
    const next = nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : '';
    window.location.href = `/login${next}`;
  },

  async forgotPassword(email) {
    return http.post('auth/forgot_password', { email });
  },

  async resetPassword(token, password) {
    return http.post('auth/reset_password', { token, password });
  },
};