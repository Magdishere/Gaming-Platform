// ---------- DOM ELEMENTS ----------
const showPlayersBtn = document.getElementById("showPlayersBtn");
const showGamesBtn = document.getElementById("showGamesBtn");
const playersSection = document.getElementById("playersSection");
const gamesSection = document.getElementById("gamesSection");

const playerForm = document.getElementById("playerForm");
const playerIdInput = document.getElementById("playerId");
const playerName = document.getElementById("playerName");
const playerEmail = document.getElementById("playerEmail");
const playerFormTitle = document.getElementById("playerFormTitle");
const playerFormBtn = document.getElementById("playerFormBtn");
const playersTableBody = document.getElementById("playersTableBody");

const gameForm = document.getElementById("gameForm");
const gameIdInput = document.getElementById("gameId");
const gameTitle = document.getElementById("gameTitle");
const gameCode = document.getElementById("gameCode");
const gameFormTitle = document.getElementById("gameFormTitle");
const gameFormBtn = document.getElementById("gameFormBtn");
const gamesTableBody = document.getElementById("gamesTableBody");

// ---------- API ----------
const API_URL = "https://gaming-platform-api-gq4p.onrender.com/api";
let allGames = [];

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

// ---------- FETCH DATA ----------
async function fetchGames() {
  const res = await fetch(`${API_URL}/games`);
  allGames = await res.json();
  gamesTableBody.innerHTML = "";
  allGames.forEach(game => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Title">${game.title}</td>
      <td data-label="Code">${game.code}</td>
      <td class="actions" data-label="Actions">
        <button class="game-edit" data-id="${game._id}">Edit</button>
        <button class="delete-game" data-id="${game._id}">Delete</button>
      </td>
    `;
    gamesTableBody.appendChild(tr);
  });
}

async function fetchPlayers() {
  const res = await fetch(`${API_URL}/players`);
  const players = await res.json();
  playersTableBody.innerHTML = "";
  players.forEach(player => {
    const joinedGames = player.joinedGames.map(g => `${g.title} (${g.code})`).join(", ") || "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Name">${player.name}</td>
      <td data-label="Email">${player.email || ""}</td>
      <td data-label="Joined Games">${joinedGames}</td>
      <td class="actions" data-label="Actions">
        <button class="player-edit" data-id="${player._id}">Edit</button>
        <button class="player-join" data-id="${player._id}">Join</button>
        <button class="player-leave" data-id="${player._id}">Leave</button>
        <button class="delete-player" data-id="${player._id}">Delete</button>
      </td>
    `;
    playersTableBody.appendChild(tr);
  });
}

// ---------- ADD / EDIT PLAYER ----------
playerForm.addEventListener("submit", async e => {
  e.preventDefault();
  const id = playerIdInput.value;
  const name = playerName.value.trim();
  const email = playerEmail.value.trim();
  if (!name) return alert("Name is required");

  if (id) {
    await fetch(`${API_URL}/players/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email })
    });
  } else {
    await fetch(`${API_URL}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email })
    });
  }

  playerForm.reset();
  playerFormTitle.textContent = "Add Player";
  playerFormBtn.textContent = "Add Player";
  playerIdInput.value = "";
  fetchPlayers();
});

// ---------- ADD / EDIT GAME ----------
gameForm.addEventListener("submit", async e => {
  e.preventDefault();
  const id = gameIdInput.value;
  const title = gameTitle.value.trim();
  const code = gameCode.value.trim();
  if (!title || !code) return alert("Both title and code are required");

  if (id) {
    await fetch(`${API_URL}/games/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, code })
    });
  } else {
    await fetch(`${API_URL}/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, code })
    });
  }

  gameForm.reset();
  gameFormTitle.textContent = "Add Game";
  gameFormBtn.textContent = "Add Game";
  gameIdInput.value = "";
  fetchGames();
});

// ---------- CLICK ACTIONS ----------
document.addEventListener("click", async e => {
  const id = e.target.dataset.id;

  // ---- PLAYER EDIT ----
  if (e.target.classList.contains("player-edit")) {
    const res = await fetch(`${API_URL}/players/${id}`);
    const player = await res.json();
    playerName.value = player.name;
    playerEmail.value = player.email || "";
    playerIdInput.value = player._id;
    playerFormTitle.textContent = "Edit Player";
    playerFormBtn.textContent = "Save Player";
  }

  // ---- GAME EDIT ----
  if (e.target.classList.contains("game-edit")) {
    const res = await fetch(`${API_URL}/games/${id}`);
    const game = await res.json();
    gameTitle.value = game.title;
    gameCode.value = game.code;
    gameIdInput.value = game._id;
    gameFormTitle.textContent = "Edit Game";
    gameFormBtn.textContent = "Save Game";
  }

  // ---- DELETE PLAYER ----
  if (e.target.classList.contains("delete-player")) {
    if (!confirm("Delete this player?")) return;
    await fetch(`${API_URL}/players/${id}`, { method: "DELETE" });
    fetchPlayers();
  }

  // ---- DELETE GAME ----
  if (e.target.classList.contains("delete-game")) {
    if (!confirm("Delete this game?")) return;
    await fetch(`${API_URL}/games/${id}`, { method: "DELETE" });
    fetchGames().then(fetchPlayers);
  }

  // ---- JOIN GAME ----
  if (e.target.classList.contains("player-join")) {
    const res = await fetch(`${API_URL}/players/${id}`);
    const player = await res.json();
    const availableGames = allGames.filter(g => !player.joinedGames.find(j => j.gameId === g._id));
    if (!availableGames.length) return alert("No available games to join");

    const choice = prompt(
      "Enter the game code to join:\n\n" + availableGames.map(g => `${g.title} (${g.code})`).join("\n")
    );
    const game = availableGames.find(g => g.code === choice?.trim());
    // if (!game) return alert("Invalid selection");

    await fetch(`${API_URL}/players/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: game._id })
    });
    fetchPlayers();
  }

  // ---- LEAVE GAME ----
  if (e.target.classList.contains("player-leave")) {
    const res = await fetch(`${API_URL}/players/${id}`);
    const player = await res.json();
    if (!player.joinedGames.length) return alert("No games to leave");

    const choice = prompt(
      "Enter the game code to leave:\n" + player.joinedGames.map(g => `${g.title} (${g.code})`).join("\n")
    );
    const game = player.joinedGames.find(g => g.code === choice?.trim());
    // if (!game) return alert("Invalid selection");

    await fetch(`${API_URL}/players/${id}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: game.gameId })
    });
    fetchPlayers();
  }
});

// ---------- INITIAL FETCH ----------
(async () => {
  await fetchGames();
  fetchPlayers();
})();
