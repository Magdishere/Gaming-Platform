// ---------- DOM ELEMENTS ----------
const showPlayersBtn = document.getElementById("showPlayersBtn");
const showGamesBtn = document.getElementById("showGamesBtn");
const playersSection = document.getElementById("playersSection");
const gamesSection = document.getElementById("gamesSection");

const playerForm = document.getElementById("playerForm");
const playerName = document.getElementById("playerName");
const playerEmail = document.getElementById("playerEmail");
const playersTableBody = document.getElementById("playersTableBody");

const gameForm = document.getElementById("gameForm");
const gameTitle = document.getElementById("gameTitle");
const gameCode = document.getElementById("gameCode");
const gamesTableBody = document.getElementById("gamesTableBody");

// ---------- TOGGLE SECTIONS ----------
showPlayersBtn.addEventListener("click", () => {
  showPlayersBtn.classList.add("active");
  showGamesBtn.classList.remove("active");
  playersSection.classList.remove("hidden");
  gamesSection.classList.add("hidden");
});

showGamesBtn.addEventListener("click", () => {
  showGamesBtn.classList.add("active");
  showPlayersBtn.classList.remove("active");
  gamesSection.classList.remove("hidden");
  playersSection.classList.add("hidden");
});

// ---------- API ----------
const API_URL = "https://gaming-platform-api-gq4p.onrender.com/api";
let allGames = [];

// ---------- FETCH ALL GAMES ----------
async function fetchGames() {
  const res = await fetch(`${API_URL}/games`);
  allGames = await res.json();
  gamesTableBody.innerHTML = "";
  allGames.forEach(game => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${game.title}</td>
      <td>${game.code}</td>
      <td class="actions">
        <button class="delete" data-id="${game._id}">Delete</button>
      </td>
    `;
    gamesTableBody.appendChild(tr);
  });
}

// ---------- FETCH ALL PLAYERS ----------
async function fetchPlayers() {
  const res = await fetch(`${API_URL}/players`);
  const players = await res.json();
  playersTableBody.innerHTML = "";
  players.forEach(player => {
    const joinedGames = player.joinedGames.map(g => g.title).join(", ") || "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${player.name}</td>
      <td>${player.email || ""}</td>
      <td>${joinedGames}</td>
      <td class="actions">
        <button class="join" data-player-id="${player._id}">Join</button>
        <button class="leave" data-player-id="${player._id}">Leave</button>
        <button class="delete" data-id="${player._id}">Delete</button>
      </td>
    `;
    playersTableBody.appendChild(tr);
  });
}

// ---------- ADD PLAYER ----------
playerForm.addEventListener("submit", async e => {
  e.preventDefault();
  const name = playerName.value.trim();
  const email = playerEmail.value.trim();
  if (!name) return alert("Name is required");

  const res = await fetch(`${API_URL}/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email })
  });
  if (res.ok) { playerForm.reset(); fetchPlayers(); }
  else { const err = await res.json(); alert(err.error || "Failed to add player"); }
});

// ---------- ADD GAME ----------
gameForm.addEventListener("submit", async e => {
  e.preventDefault();
  const title = gameTitle.value.trim();
  const code = gameCode.value.trim();
  if (!title || !code) return alert("Title and code are required");

  const res = await fetch(`${API_URL}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, code })
  });
  if (res.ok) { gameForm.reset(); fetchGames(); fetchPlayers(); }
  else { const err = await res.json(); alert(err.error || "Failed to add game"); }
});

// ---------- CLICK ACTIONS ----------
document.addEventListener("click", async e => {
  const playerId = e.target.dataset.playerId;
  const td = e.target.closest("td");

  // --- DELETE PLAYER OR GAME ---
  if (e.target.classList.contains("delete")) {
    const id = e.target.dataset.id;
    const type = e.target.closest("table").id.includes("players") ? "players" : "games";
    if (!confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;
    const res = await fetch(`${API_URL}/${type}/${id}`, { method: "DELETE" });
    if (res.ok) { type === "players" ? fetchPlayers() : fetchGames().then(fetchPlayers); }
    else { const err = await res.json(); alert(err.error || "Failed to delete"); }
  }

  // --- JOIN GAME ---
  if (e.target.classList.contains("join")) {
    const code = prompt("Enter game code to join:");
    if (!code) return;
    const game = allGames.find(g => g.code === code.trim());
    if (!game) return alert("Invalid game code");

    const res = await fetch(`${API_URL}/players/${playerId}/join`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ gameId: game._id })
    });
    if (res.ok) fetchPlayers();
    else { const err = await res.json(); alert(err.error || "Failed to join game"); }
  }

  // --- LEAVE GAME ---
  if (e.target.classList.contains("leave")) {
    const code = prompt("Enter game code to leave:");
    if (!code) return;

    const playerRes = await fetch(`${API_URL}/players/${playerId}`);
    const player = await playerRes.json();
    const joined = player.joinedGames.find(g => g.code === code.trim());
    if (!joined) return alert("You are not joined in this game");

    const res = await fetch(`${API_URL}/players/${playerId}/leave`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ gameId: joined.gameId })
    });
    if (res.ok) fetchPlayers();
    else { const err = await res.json(); alert(err.error || "Failed to leave game"); }
  }
});

// ---------- INITIAL FETCH ----------
(async () => { await fetchGames(); fetchPlayers(); })();
