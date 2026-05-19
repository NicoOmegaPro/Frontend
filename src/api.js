export const API = 'http://localhost:3000/api';

export function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}
