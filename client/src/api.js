const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new Error('Could not reach the server. Check that the backend is running.');
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error?.message || 'Something went wrong. Please try again.');
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  habits: (date) => request(`/habits?date=${date}`),
  createHabit: (body) => request('/habits', { method: 'POST', body: JSON.stringify(body) }),
  updateHabit: (id, body) => request(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteHabit: (id) => request(`/habits/${id}`, { method: 'DELETE' }),
  checkIn: (id, date, completed) => request(`/habits/${id}/check-ins/${date}`, {
    method: 'PUT', body: JSON.stringify({ completed }),
  }),
  dashboard: (date) => request(`/dashboard?date=${date}`),
};
