const BASE_URL = import.meta.env.VITE_API_URL;

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw error;
  }
  return res.json();
};

export const getMe = () => apiFetch('/auth/me');
export const logout = () => apiFetch('/auth/logout', { method: 'POST' });
export const getRepos = () => apiFetch('/repos');
export const getGithubRepos = () => apiFetch('/repos/github');
export const connectRepo = (data) =>
  apiFetch('/repos/connect', { method: 'POST', body: JSON.stringify(data) });
export const disconnectRepo = (id) =>
  apiFetch(`/repos/${id}`, { method: 'DELETE' });