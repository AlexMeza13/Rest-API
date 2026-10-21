<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from './services/api.js';

const session = ref(null);
const loginForm = reactive({ email: '', password: '' });
const loginError = ref('');
const busy = ref(false);
const activeSection = ref('players');
const players = ref([]);
const rosters = ref([]);
const users = ref([]);
const userEdits = reactive({});
const selectedRoster = ref(null);
const rosterPlayers = ref([]);
const roles = ref(['Top', 'Jungle', 'Mid', 'ADC', 'Support']);
const states = ref(['activo', 'inactivo']);
const rosterTypes = ref(['Principal', 'Academy']);
const lineupBusy = ref(false);
const assignmentForm = reactive({ playerId: 0, role: 'Titular' });
const notice = ref('');
const noticeType = ref('success');
const playerDialog = ref(false);
const rosterDialog = ref(false);
const editingPlayerId = ref(null);
const editingRosterId = ref(null);
const playerForm = reactive({
  nickname: '',
  nombre_real: '',
  pais: '',
  rol: 'Top',
  estado: 'activo'
});
const rosterForm = reactive({
  nombre: '',
  tipo: 'Principal',
  temporada: new Date().getFullYear().toString()
});
const userForm = reactive({
  email: '',
  password: '',
  rol: 'entrenador',
  id_jugador: 0
});

const availableRosterPlayers = computed(() => {
  const assignedIds = new Set(rosterPlayers.value.map((player) => player.id));
  return players.value.filter((player) => !assignedIds.has(player.id));
});
const unlinkedPlayers = computed(() => players.value.filter((player) =>
  !users.value.some((user) => user.id_jugador === player.id)
));
const playerDisplayName = computed(() =>
  rosterPlayers.value.find((player) => player.id === session.value?.id_jugador)?.nickname ||
  session.value?.email?.split('@')[0] ||
  'Jugador'
);

function showNotice(message, type = 'success') {
  notice.value = message;
  noticeType.value = type;
  window.clearTimeout(showNotice.timeout);
  showNotice.timeout = window.setTimeout(() => { notice.value = ''; }, 3600);
}

async function loadPlayers() {
  players.value = await api.listPlayers();
}

async function loadRosters() {
  rosters.value = await api.listRosters();
}

async function loadUsers() {
  users.value = await api.listUsers();
  for (const id of Object.keys(userEdits)) delete userEdits[id];
  for (const user of users.value) {
    userEdits[user.id] = {
      rol: user.rol,
      estado: user.estado,
      id_jugador: user.id_jugador ?? 0
    };
  }
}

async function loadDashboardData() {
  if (session.value?.rol === 'jugador') {
    activeSection.value = 'playerGroup';
    try {
      await loadRosters();
      if (rosters.value.length) {
        await fetchRosterDetails(rosters.value[0].id);
      } else {
        selectedRoster.value = null;
        rosterPlayers.value = [];
      }
    } catch (error) {
      showNotice(error.message, 'error');
    }
    return;
  }

  const requests = [
    loadPlayers(),
    loadRosters(),
    api.getRoles(),
    api.getStates(),
    api.getRosterTypes()
  ];
  if (session.value?.rol === 'admin') requests.push(loadUsers());

  const results = await Promise.allSettled(requests);

  if (results[2].status === 'fulfilled') roles.value = results[2].value;
  if (results[3].status === 'fulfilled') states.value = results[3].value;
  if (results[4].status === 'fulfilled') rosterTypes.value = results[4].value;

  const failedLoad = results.find((result, index) =>
    (index < 2 || index === 5) && result.status === 'rejected'
  );
  if (failedLoad) showNotice(failedLoad.reason.message, 'error');
}

async function submitLogin() {
  loginError.value = '';
  busy.value = true;
  try {
    const data = await api.login(loginForm.email, loginForm.password);
    session.value = data.usuario;
    loginForm.password = '';
    await loadDashboardData();
  } catch (error) {
    loginError.value = error.message;
  } finally {
    busy.value = false;
  }
}

async function logout() {
  busy.value = true;
  try {
    await api.logout();
    session.value = null;
    selectedRoster.value = null;
    showNotice('Sesión cerrada correctamente.');
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    busy.value = false;
  }
}

async function changeSection(section) {
  if (session.value?.rol === 'jugador') return;
  activeSection.value = section;
  selectedRoster.value = null;
  if (section === 'players') await refresh(loadPlayers);
  else if (section === 'rosters') await refresh(loadRosters);
  else await refresh(loadUsers);
}

async function refresh(loader) {
  try {
    await loader();
  } catch (error) {
    showNotice(error.message, 'error');
  }
}

function resetPlayerForm() {
  Object.assign(playerForm, {
    nickname: '',
    nombre_real: '',
    pais: '',
    rol: roles.value[0] || 'Top',
    estado: states.value[0] || 'activo'
  });
  editingPlayerId.value = null;
}

function openPlayerDialog(player = null) {
  resetPlayerForm();
  if (player) {
    editingPlayerId.value = player.id;
    Object.assign(playerForm, {
      nickname: player.nickname,
      nombre_real: player.nombre_real,
      pais: player.pais,
      rol: player.rol,
      estado: player.estado
    });
  }
  playerDialog.value = true;
}

async function savePlayer() {
  busy.value = true;
  try {
    if (editingPlayerId.value) {
      await api.updatePlayer(editingPlayerId.value, { ...playerForm });
      showNotice('Jugador actualizado.');
    } else {
      await api.createPlayer({ ...playerForm });
      showNotice('Jugador agregado al roster pool.');
    }
    playerDialog.value = false;
    await loadPlayers();
    if (selectedRoster.value) await openRoster(selectedRoster.value.id);
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    busy.value = false;
  }
}

async function removePlayer(player) {
  if (!window.confirm(`¿Eliminar a ${player.nickname}?`)) return;
  try {
    await api.deletePlayer(player.id);
    await loadPlayers();
    if (selectedRoster.value) await openRoster(selectedRoster.value.id);
    showNotice('Jugador eliminado.');
  } catch (error) {
    showNotice(error.message, 'error');
  }
}

function openRosterDialog(roster = null) {
  editingRosterId.value = roster?.id ?? null;
  Object.assign(rosterForm, roster ? {
    nombre: roster.nombre,
    tipo: roster.tipo,
    temporada: roster.temporada
  } : {
    nombre: '',
    tipo: rosterTypes.value[0] || 'Principal',
    temporada: new Date().getFullYear().toString()
  });
  rosterDialog.value = true;
}

async function saveRoster() {
  busy.value = true;
  try {
    if (editingRosterId.value) {
      await api.updateRoster(editingRosterId.value, { ...rosterForm });
      showNotice('Roster actualizado.');
    } else {
      await api.createRoster({ ...rosterForm });
      showNotice('Roster creado.');
    }
    rosterDialog.value = false;
    await loadRosters();
    if (selectedRoster.value) await openRoster(selectedRoster.value.id);
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    busy.value = false;
  }
}

async function fetchRosterDetails(id) {
  const [roster, rosterMembers] = await Promise.all([
    api.getRoster(id),
    api.getRosterPlayers(id)
  ]);
  selectedRoster.value = roster;
  rosterPlayers.value = rosterMembers;
  assignmentForm.playerId = availableRosterPlayers.value[0]?.id ?? 0;
  assignmentForm.role = 'Titular';
  activeSection.value = session.value?.rol === 'jugador' ? 'playerGroup' : 'rosters';
}

async function openRoster(id) {
  try {
    await fetchRosterDetails(id);
  } catch (error) {
    showNotice(error.message, 'error');
  }
}

async function assignPlayerToRoster() {
  if (!selectedRoster.value || !assignmentForm.playerId) return;

  lineupBusy.value = true;
  const rosterId = selectedRoster.value.id;
  try {
    await api.assignPlayerToRoster(rosterId, {
      id_jugador: Number(assignmentForm.playerId),
      rol_en_roster: assignmentForm.role
    });
    await fetchRosterDetails(rosterId);
    showNotice('Jugador asignado al roster.');
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    lineupBusy.value = false;
  }
}

async function changeRosterPlayerRole(player, role) {
  if (!selectedRoster.value || role === player.rol_en_roster) return;

  lineupBusy.value = true;
  const rosterId = selectedRoster.value.id;
  try {
    await api.updateRosterPlayerRole(rosterId, player.id, role);
    await fetchRosterDetails(rosterId);
    showNotice('Rol actualizado.');
  } catch (error) {
    showNotice(error.message, 'error');
    try {
      await fetchRosterDetails(rosterId);
    } catch (refreshError) {
      showNotice(`No se pudo actualizar la alineación: ${refreshError.message}`, 'error');
    }
  } finally {
    lineupBusy.value = false;
  }
}

async function removePlayerFromRoster(player) {
  if (!selectedRoster.value ||
      !window.confirm(`¿Quitar a ${player.nickname} de este roster?`)) return;

  lineupBusy.value = true;
  const rosterId = selectedRoster.value.id;
  try {
    await api.removePlayerFromRoster(rosterId, player.id);
    await fetchRosterDetails(rosterId);
    showNotice('Jugador quitado del roster.');
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    lineupBusy.value = false;
  }
}

async function removeRoster(roster) {
  if (!window.confirm(`¿Eliminar el roster “${roster.nombre}”?`)) return;
  try {
    await api.deleteRoster(roster.id);
    if (selectedRoster.value?.id === roster.id) selectedRoster.value = null;
    await loadRosters();
    showNotice('Roster eliminado.');
  } catch (error) {
    showNotice(error.message, 'error');
  }
}

async function createManagedUser() {
  try {
    await api.createUser({
      ...userForm,
      id_jugador: userForm.rol === 'jugador' ? Number(userForm.id_jugador) : undefined
    });
    userForm.email = '';
    userForm.password = '';
    userForm.rol = 'entrenador';
    userForm.id_jugador = 0;
    await loadUsers();
    showNotice('Cuenta creada.');
  } catch (error) {
    showNotice(error.message, 'error');
  }
}

function availablePlayersForUser(user) {
  return players.value.filter((player) =>
    !users.value.some((otherUser) =>
      otherUser.id !== user.id && otherUser.id_jugador === player.id
    )
  );
}

function hasUserChanges(user) {
  const edit = userEdits[user.id];
  return edit.rol !== user.rol ||
    edit.estado !== user.estado ||
    Number(edit.id_jugador || 0) !== Number(user.id_jugador || 0);
}

async function saveManagedUser(user) {
  const edit = userEdits[user.id];
  const changes = {
    rol: edit.rol,
    estado: edit.estado,
    id_jugador: edit.rol === 'jugador' ? Number(edit.id_jugador) : null
  };
  try {
    await api.updateUser(user.id, changes);
    await loadUsers();
    showNotice('Cuenta actualizada.');
  } catch (error) {
    showNotice(error.message, 'error');
    await refresh(loadUsers);
  }
}

onMounted(async () => {
  try {
    const data = await api.verifySession();
    session.value = data.usuario;
    await loadDashboardData();
  } catch (error) {
    if (!error.message.includes('(401)') && !error.message.includes('Autenticacion requerida')) {
      showNotice(error.message, 'error');
    }
  }
});
</script>

<template>
  <main v-if="!session" class="login-page">
    <form class="login-card" @submit.prevent="submitLogin">
      <h1>Inicia sesión</h1>
      <p class="login-intro">Ingresa a tu cuenta para gestionar jugadores y rosters.</p>
      <label for="email">Correo electrónico</label>
      <input id="email" v-model="loginForm.email" type="email" autocomplete="username" placeholder="nombre@equipo.com" required />
      <label for="password">Contraseña</label>
      <input id="password" v-model="loginForm.password" type="password" autocomplete="current-password" placeholder="Tu contraseña" required />
      <p v-if="loginError" class="form-error" role="alert">{{ loginError }}</p>
      <button class="primary-button login-button" type="submit" :disabled="busy">
        {{ busy ? 'Iniciando sesión…' : 'Iniciar sesión' }}
      </button>
    </form>
  </main>

  <main v-else class="workspace">
    <aside class="app-sidebar">
      <div class="sidebar-heading">GESTIÓN DEL EQUIPO</div>
      <nav v-if="session.rol !== 'jugador'" class="sidebar-nav" aria-label="Secciones">
        <button class="sidebar-item" :class="{ active: activeSection === 'players' }" @click="changeSection('players')">
          <span class="sidebar-icon">J</span><span>Jugadores</span>
        </button>
        <button class="sidebar-item" :class="{ active: activeSection === 'rosters' }" @click="changeSection('rosters')">
          <span class="sidebar-icon">R</span><span>Rosters</span>
        </button>
        <button v-if="session.rol === 'admin'" class="sidebar-item" :class="{ active: activeSection === 'users' }" @click="changeSection('users')">
          <span class="sidebar-icon">C</span><span>Cuentas</span>
        </button>
      </nav>
      <nav v-else class="sidebar-nav" aria-label="Secciones">
        <button class="sidebar-item active" type="button">
          <span class="sidebar-icon">G</span><span>Mi grupo</span>
        </button>
      </nav>
      <div class="sidebar-account">
        <span class="profile-avatar">{{ session.email?.slice(0, 1).toUpperCase() }}</span>
        <span class="sidebar-email">{{ session.email }}</span>
        <button class="sidebar-logout" :disabled="busy" @click="logout">Cerrar sesión</button>
      </div>
    </aside>

    <div class="workspace-main">
      <section class="main-panel">
        <div class="content-area">
        <div v-if="notice" class="toast" :class="`toast-${noticeType}`" role="status">{{ notice }}</div>

        <template v-if="activeSection === 'playerGroup'">
          <div class="player-page-heading">
            <h1>Bienvenido, {{ playerDisplayName }}</h1>
            <p>Esta es la organización de tu equipo.</p>
          </div>

          <section v-if="rosters.length" class="data-card player-group-card">
            <nav v-if="rosters.length > 1" class="player-roster-tabs" aria-label="Seleccionar grupo">
              <button
                v-for="(roster, index) in rosters"
                :key="roster.id"
                type="button"
                class="player-roster-tab"
                :class="{ active: selectedRoster?.id === roster.id }"
                :aria-pressed="selectedRoster?.id === roster.id"
                @click="openRoster(roster.id)"
              >
                <span class="roster-symbol">R{{ index + 1 }}</span>
                <span class="player-roster-tab-label">
                  <strong>{{ roster.nombre }}</strong>
                  <small>{{ roster.tipo }} · Temporada {{ roster.temporada }}</small>
                </span>
              </button>
            </nav>

            <template v-if="selectedRoster">
              <div class="player-group-heading">
                <h2>{{ selectedRoster.nombre }}</h2>
                <p>{{ selectedRoster.tipo }} · Temporada {{ selectedRoster.temporada }}</p>
              </div>
              <div v-if="rosterPlayers.length" class="table-wrap">
                <table class="player-lineup-table">
                  <thead>
                    <tr>
                      <th>JUGADOR</th>
                      <th>POSICIÓN</th>
                      <th>ASIGNACIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="player in rosterPlayers" :key="player.id">
                      <td>
                        <div class="player-cell">
                          <span class="player-avatar">{{ player.nickname?.slice(0, 2).toUpperCase() }}</span>
                          <strong>{{ player.nickname }}</strong>
                        </div>
                      </td>
                      <td><span class="role-pill">{{ player.rol }}</span></td>
                      <td><span class="lineup-status">{{ player.rol_en_roster }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="empty-lineup player-empty-lineup">Este grupo aún no tiene jugadores asignados.</div>
            </template>
          </section>

          <section v-else class="data-card player-empty-card">
            <div class="empty-state">
              <strong>Aún no tienes un grupo asignado</strong>
              <p>Pide al administrador que vincule tu perfil a un roster.</p>
            </div>
          </section>
        </template>

        <template v-else-if="activeSection === 'players'">
          <div v-if="session.rol === 'admin'" class="page-heading player-admin-heading">
            <button class="primary-button" @click="openPlayerDialog()">＋ Añadir jugador</button>
          </div>
          <div v-else class="page-heading player-directory-heading">
            <div>
              <h1>Jugadores</h1>
              <p class="page-subtitle">Perfiles disponibles para integrar a tus rosters.</p>
            </div>
          </div>
          <section class="data-card">
            <div class="section-heading">
              <div>
                <h2>{{ session.rol === 'admin' ? 'Todos los jugadores' : 'Perfiles disponibles' }}</h2>
                <p>{{ session.rol === 'admin' ? 'Perfiles del equipo.' : 'Selecciona uno al administrar la alineación de un roster.' }}</p>
              </div>
            </div>
            <div v-if="players.length" class="table-wrap">
              <table><thead><tr><th>JUGADOR</th><th>ROL</th><th>PAÍS</th><th>ESTADO</th><th v-if="session.rol === 'admin'"></th></tr></thead>
                <tbody><tr v-for="player in players" :key="player.id">
                  <td><div class="player-cell"><span class="player-avatar">{{ player.nickname?.slice(0, 2).toUpperCase() }}</span><span><strong>{{ player.nickname }}</strong><small>{{ player.nombre_real }}</small></span></div></td>
                  <td><span class="role-pill">{{ player.rol }}</span></td><td>{{ player.pais }}</td>
                  <td><span class="state-pill" :class="player.estado === 'activo' ? 'state-active' : 'state-inactive'"><i></i>{{ player.estado }}</span></td>
                  <td v-if="session.rol === 'admin'">
                    <div class="row-actions">
                      <button class="row-action-button" aria-label="Editar jugador" title="Editar" @click="openPlayerDialog(player)">Editar</button>
                      <button class="row-action-button row-action-danger" aria-label="Eliminar jugador" title="Eliminar" @click="removePlayer(player)">Eliminar</button>
                    </div>
                  </td>
                </tr></tbody>
              </table>
            </div>
            <div v-else class="empty-state">
              <strong>Aún no hay jugadores</strong>
              <p>{{ session.rol === 'admin' ? 'Agrega el primer perfil para comenzar.' : 'Pide al administrador que registre los perfiles de jugadores.' }}</p>
              <button v-if="session.rol === 'admin'" class="text-button" @click="openPlayerDialog()">＋ Añadir jugador</button>
            </div>
          </section>
        </template>

        <template v-else-if="activeSection === 'rosters'">
          <div class="page-heading">
            <div><h1>Rosters</h1></div>
            <button class="primary-button" @click="openRosterDialog()">＋ Crear roster</button>
          </div>
          <div class="roster-layout">
            <section class="data-card roster-list-card">
              <div class="section-heading">
                <div><h2>Equipos</h2><p>Rosters activos y en preparación.</p></div>
              </div>
              <div v-if="rosters.length" class="table-wrap roster-table-wrap">
                <table class="roster-table">
                  <thead>
                    <tr><th>ROSTER</th><th>TIPO</th><th>TEMPORADA</th><th class="roster-actions-heading">ACCIONES</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="(roster, index) in rosters" :key="roster.id" :class="{ selected: selectedRoster?.id === roster.id }" @click="openRoster(roster.id)">
                      <td>
                        <button type="button" class="roster-name-button" @click.stop="openRoster(roster.id)">
                          <span class="roster-symbol">R{{ index + 1 }}</span>
                          <strong>{{ roster.nombre }}</strong>
                        </button>
                      </td>
                      <td>{{ roster.tipo }}</td>
                      <td>{{ roster.temporada }}</td>
                      <td>
                        <div class="row-actions roster-row-actions">
                          <button class="row-action-button" :aria-label="`Editar roster ${roster.nombre}`" @click.stop="openRosterDialog(roster)">Editar</button>
                          <button class="row-action-button row-action-danger" :aria-label="`Eliminar roster ${roster.nombre}`" @click.stop="removeRoster(roster)">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="empty-state"><strong>Aún no hay rosters</strong><p>Crea un roster para organizar el equipo.</p><button class="text-button" @click="openRosterDialog()">＋ Crear roster</button></div>
            </section>
            <section class="data-card roster-detail-card">
              <template v-if="selectedRoster">
                <div class="section-heading"><div><h2>{{ selectedRoster.nombre }}</h2><p>{{ selectedRoster.tipo }} · Temporada {{ selectedRoster.temporada }}</p></div><button class="close-detail" aria-label="Cerrar detalle" @click="selectedRoster = null">×</button></div>
                <div class="lineup-label"><span>ALINEACIÓN</span><span>{{ rosterPlayers.length }} JUGADORES</span></div>
                <div v-if="rosterPlayers.length" class="lineup-list">
                  <div v-for="player in rosterPlayers" :key="player.id" class="lineup-row">
                    <span class="lineup-position">{{ player.rol }}</span>
                    <strong>{{ player.nickname }}</strong>
                    <select
                      class="lineup-role-select"
                      :value="player.rol_en_roster"
                      :disabled="lineupBusy"
                      :aria-label="`Rol de ${player.nickname} en el roster`"
                      @change="changeRosterPlayerRole(player, $event.target.value)"
                    >
                      <option value="Titular">Titular</option>
                      <option value="Suplente">Suplente</option>
                    </select>
                    <button
                      type="button"
                      class="lineup-remove"
                      :disabled="lineupBusy"
                      :aria-label="`Quitar a ${player.nickname} del roster`"
                      @click="removePlayerFromRoster(player)"
                    >Quitar</button>
                  </div>
                </div>
                <div v-else class="empty-lineup">Este roster aún no tiene jugadores asignados.</div>
                <form class="assignment-form" @submit.prevent="assignPlayerToRoster">
                  <label class="assignment-field" for="roster-player">
                    <span>Añadir jugador</span>
                    <select id="roster-player" v-model.number="assignmentForm.playerId" :disabled="!availableRosterPlayers.length || lineupBusy">
                      <option :value="0" disabled>Selecciona un jugador</option>
                      <option v-for="player in availableRosterPlayers" :key="player.id" :value="player.id">
                        {{ player.nickname }} · {{ player.rol }}
                      </option>
                    </select>
                  </label>
                  <label class="assignment-field" for="roster-player-role">
                    <span>Asignación</span>
                    <select id="roster-player-role" v-model="assignmentForm.role" :disabled="lineupBusy">
                      <option value="Titular">Titular</option>
                      <option value="Suplente">Suplente</option>
                    </select>
                  </label>
                  <button class="primary-button assignment-button" :disabled="!availableRosterPlayers.length || lineupBusy">
                    {{ lineupBusy ? 'Guardando…' : 'Añadir al roster' }}
                  </button>
                  <p v-if="!availableRosterPlayers.length" class="assignment-help">Todos los jugadores disponibles ya están asignados.</p>
                </form>
              </template>
              <div v-else class="detail-placeholder"><strong>Selecciona un roster</strong><p>Consulta aquí su alineación.</p></div>
            </section>
          </div>
        </template>

        <template v-else-if="activeSection === 'users' && session.rol === 'admin'">
          <section class="data-card account-create-card">
            <div class="section-heading"><div><h2>Crear cuenta</h2><p>Las contraseñas deben tener al menos 8 caracteres.</p></div></div>
            <form class="account-create-form" @submit.prevent="createManagedUser">
              <label>Correo electrónico<input v-model.trim="userForm.email" type="email" autocomplete="off" required maxlength="254" /></label>
            <label>Contraseña inicial<input v-model="userForm.password" type="password" autocomplete="new-password" required minlength="8" maxlength="72" /></label>
            <label>Rol<select v-model="userForm.rol" @change="userForm.id_jugador = 0"><option value="entrenador">Entrenador</option><option value="jugador">Jugador</option><option value="admin">Admin</option></select></label>
            <label v-if="userForm.rol === 'jugador'">Perfil de jugador<select v-model.number="userForm.id_jugador" required><option :value="0" disabled>Selecciona un perfil</option><option v-for="player in unlinkedPlayers" :key="player.id" :value="player.id">{{ player.nickname }}</option></select></label>
            <p v-if="userForm.rol === 'jugador' && !unlinkedPlayers.length" class="account-help">Todos los perfiles ya tienen cuenta vinculada.</p>
            <button class="primary-button" :disabled="userForm.rol === 'jugador' && (!unlinkedPlayers.length || !userForm.id_jugador)">Crear cuenta</button>
            </form>
          </section>
          <section class="data-card account-list-card">
            <div class="section-heading"><div><h2>Cuentas registradas</h2><p>{{ users.length }} cuentas</p></div></div>
            <div v-if="users.length" class="table-wrap">
              <table><thead><tr><th>CUENTA</th><th>ROL</th><th>PERFIL</th><th>ESTADO</th><th>CREADA</th><th></th></tr></thead>
                <tbody><tr v-for="user in users" :key="user.id">
                  <td><div class="user-cell"><span class="profile-avatar">{{ user.email.slice(0, 1).toUpperCase() }}</span><strong>{{ user.email }}</strong><span v-if="user.id === session.id" class="self-label">Tú</span></div></td>
                  <td><select v-model="userEdits[user.id].rol" class="account-select" :disabled="user.id === session.id" :aria-label="`Rol de ${user.email}`"><option value="admin">Admin</option><option value="entrenador">Entrenador</option><option value="jugador">Jugador</option></select></td>
                  <td><select v-model.number="userEdits[user.id].id_jugador" class="account-select" :disabled="userEdits[user.id].rol !== 'jugador' || user.id === session.id" :aria-label="`Perfil vinculado a ${user.email}`"><option :value="0" disabled>Selecciona perfil</option><option v-for="player in availablePlayersForUser(user)" :key="player.id" :value="player.id">{{ player.nickname }}</option></select></td>
                  <td><select v-model="userEdits[user.id].estado" class="account-select" :disabled="user.id === session.id" :aria-label="`Estado de ${user.email}`"><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></td>
                  <td>{{ new Date(user.createdAt).toLocaleDateString() }}</td>
                  <td><button class="row-action-button" :disabled="user.id === session.id || !hasUserChanges(user)" @click="saveManagedUser(user)">Guardar</button></td>
                </tr></tbody>
              </table>
            </div>
            <div v-else class="empty-state"><strong>No hay cuentas registradas</strong></div>
          </section>
        </template>
        </div>
        <footer class="workspace-footer"><span>Gestión de equipos</span></footer>
      </section>
    </div>

    <div v-if="playerDialog" class="modal-backdrop" @click.self="playerDialog = false">
      <form class="dialog" @submit.prevent="savePlayer">
        <div class="dialog-heading"><div><h2>{{ editingPlayerId ? 'Editar jugador' : 'Nuevo jugador' }}</h2></div><button type="button" class="close-detail" aria-label="Cerrar" @click="playerDialog = false">×</button></div>
        <label>Nickname<input v-model.trim="playerForm.nickname" required maxlength="255" /></label>
        <label>Nombre real<input v-model.trim="playerForm.nombre_real" required maxlength="255" /></label>
        <div class="form-row"><label>País<input v-model.trim="playerForm.pais" required maxlength="255" placeholder="MX" /></label><label>Rol<select v-model="playerForm.rol"><option v-for="role in roles" :key="role">{{ role }}</option></select></label></div>
        <label>Estado<select v-model="playerForm.estado"><option v-for="state in states" :key="state">{{ state }}</option></select></label>
        <div class="dialog-actions"><button type="button" class="secondary-button" @click="playerDialog = false">Cancelar</button><button class="primary-button" :disabled="busy">{{ busy ? 'Guardando…' : 'Guardar jugador' }}</button></div>
      </form>
    </div>

    <div v-if="rosterDialog" class="modal-backdrop" @click.self="rosterDialog = false">
      <form class="dialog" @submit.prevent="saveRoster">
        <div class="dialog-heading"><div><h2>{{ editingRosterId ? 'Editar roster' : 'Nuevo roster' }}</h2></div><button type="button" class="close-detail" aria-label="Cerrar" @click="rosterDialog = false">×</button></div>
        <label>Nombre del roster<input v-model.trim="rosterForm.nombre" required maxlength="255" placeholder="EA Main Squad" /></label>
        <div class="form-row"><label>Tipo<select v-model="rosterForm.tipo"><option v-for="type in rosterTypes" :key="type">{{ type }}</option></select></label><label>Temporada<input v-model.trim="rosterForm.temporada" required maxlength="255" /></label></div>
        <div class="dialog-actions"><button type="button" class="secondary-button" @click="rosterDialog = false">Cancelar</button><button class="primary-button" :disabled="busy">{{ busy ? 'Guardando…' : 'Guardar roster' }}</button></div>
      </form>
    </div>
  </main>
</template>
