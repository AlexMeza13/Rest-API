const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let csrfToken = '';

function readCsrfCookie() {
  const prefix = 'csrf_token=';
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : '';
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const options = {
    method,
    credentials: 'include',
    headers: { ...headers }
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = csrfToken || readCsrfCookie();
    if (token) options.headers['X-CSRF-Token'] = token;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = response.status === 204
    ? null
    : await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) csrfToken = '';
    throw new Error(data?.error || `Error del servidor (${response.status})`);
  }

  return data;
}

export const api = {
  health: () => request('/health'),
  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    csrfToken = data.csrfToken;
    return data;
  },
  async logout() {
    try {
      return await request('/auth/logout', { method: 'POST' });
    } finally {
      csrfToken = '';
    }
  },
  async verifySession() {
    const data = await request('/auth/verify');
    csrfToken = readCsrfCookie();
    return data;
  },
  listPlayers: () => request('/jugadores'),
  createPlayer: (player) => request('/jugadores', { method: 'POST', body: player }),
  updatePlayer: (id, player) => request(`/jugadores/${id}`, { method: 'PUT', body: player }),
  deletePlayer: (id) => request(`/jugadores/${id}`, { method: 'DELETE' }),
  listRosters: () => request('/rosters'),
  getRoster: (id) => request(`/rosters/${id}`),
  createRoster: (roster) => request('/rosters', { method: 'POST', body: roster }),
  updateRoster: (id, roster) => request(`/rosters/${id}`, { method: 'PUT', body: roster }),
  deleteRoster: (id) => request(`/rosters/${id}`, { method: 'DELETE' }),
  getRosterPlayers: (id) => request(`/rosters/${id}/jugadores`),
  assignPlayerToRoster: (rosterId, assignment) =>
    request(`/rosters/${rosterId}/jugadores`, { method: 'POST', body: assignment }),
  updateRosterPlayerRole: (rosterId, playerId, role) =>
    request(`/rosters/${rosterId}/jugadores/${playerId}`, {
      method: 'PUT',
      body: { rol_en_roster: role }
    }),
  removePlayerFromRoster: (rosterId, playerId) =>
    request(`/rosters/${rosterId}/jugadores/${playerId}`, { method: 'DELETE' }),
  listUsers: () => request('/usuarios'),
  createUser: (user) => request('/usuarios', { method: 'POST', body: user }),
  updateUser: (id, changes) => request(`/usuarios/${id}`, { method: 'PUT', body: changes }),
  getRoles: () => request('/roles'),
  getStates: () => request('/estados'),
  getRosterTypes: () => request('/tipos-roster')
};
