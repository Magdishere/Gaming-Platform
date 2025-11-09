// === DOM ELEMENTS ===
const showPlayersBtn = document.getElementById("showPlayersBtn");
const showGamesBtn = document.getElementById("showGamesBtn");
const playersSection = document.getElementById("playersSection");
const gamesSection = document.getElementById("gamesSection");

const playerForm = document.getElementById("playerForm");
const playerFormTitle = document.getElementById("playerFormTitle");
const playerFormBtn = document.getElementById("playerFormBtn");
const playerIdInput = document.getElementById("playerId");
const playerName = document.getElementById("playerName");
const playerEmail = document.getElementById("playerEmail");
const playersTableBody = document.getElementById("playersTableBody");

const gameForm = document.getElementById("gameForm");
const gameFormTitle = document.getElementById("gameFormTitle");
const gameFormBtn = document.getElementById("gameFormBtn");
const gameIdInput = document.getElementById("gameId");
const gameTitle = document.getElementById("gameTitle");
const gameCode = document.getElementById("gameCode");
const gamesTableBody = document.getElementById("gamesTableBody");

// === API URL ===
const API_URL = "https://gaming-platform-api-gq4p.onrender.com/api";
let allGames = [];

// === TOGGLE SECTIONS ===
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

// === FETCH DATA ===
async function fetchGames() {
  const res = await fetch(`${API_URL}/games`);
  allGames = await res.json();
  gamesTableBody.innerHTML = "";
  allGames.forEach((game) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Title">${game.title}</td>
      <td data-label="Code">${game.code}</td>
      <td class="actions" data-label="Actions">
        <button class="edit" data-type="game" data-id="${game._id}">Edit</button>
        <button class="delete" data-type="game" data-id="${game._id}">Delete</button>
      </td>
    `;
    gamesTableBody.appendChild(tr);
  });
}

async function fetchPlayers() {
  const res = await fetch(`${API_URL}/players`);
  const players = await res.json();
  playersTableBody.innerHTML = "";
  players.forEach((player) => {
    const joinedGames = player.joinedGames.map((g) => `${g.title} (${g.code})`).join(", ") || "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Name">${player.name}</td>
      <td data-label="Email">${player.email || ""}</td>
      <td data-label="Joined Games">${joinedGames}</td>
      <td class="actions" data-label="Actions">
        <button class="edit" data-type="player" data-id="${player._id}">Edit</button>
        <button class="join" data-player-id="${player._id}">Join</button>
        <button class="leave" data-player-id="${player._id}">Leave</button>
        <button class="delete" data-type="player" data-id="${player._id}">Delete</button>
      </td>
    `;
    playersTableBody.appendChild(tr);
  });
}

// === SUBMIT HANDLERS ===
playerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = playerIdInput.value;
  const data = { name: playerName.value.trim(), email: playerEmail.value.trim() };

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_URL}/players/${id}` : `${API_URL}/players`;

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    playerForm.reset();
    playerIdInput.value = "";
    playerFormTitle.textContent = "Add Player";
    playerFormBtn.textContent = "Add Player";
    fetchPlayers();
  } else alert("Error saving player");
});

gameForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = gameIdInput.value;
  const data = { title: gameTitle.value.trim(), code: gameCode.value.trim() };

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_URL}/games/${id}` : `${API_URL}/games`;

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    gameForm.reset();
    gameIdInput.value = "";
    gameFormTitle.textContent = "Add Game";
    gameFormBtn.textContent = "Add Game";
    fetchGames();
    fetchPlayers();
  } else alert("Error saving game");
});

// === CLICK ACTIONS ===
document.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;

  // Delete
  if (e.target.classList.contains("delete")) {
    const type = e.target.dataset.type;
    if (!confirm(`Delete this ${type}?`)) return;
    const res = await fetch(`${API_URL}/${type}s/${id}`, { method: "DELETE" });
    if (res.ok) {
      type === "player" ? fetchPlayers() : fetchGames().then(fetchPlayers);
    } else alert("Delete failed");
  }

  // Edit
  if (e.target.classList.contains("edit")) {
    const type = e.target.dataset.type;
    const res = await fetch(`${API_URL}/${type}s/${id}`);
    const data = await res.json();

    if (type === "player") {
      playerIdInput.value = data._id;
      playerName.value = data.name;
      playerEmail.value = data.email || "";
      playerFormTitle.textContent = "Edit Player";
      playerFormBtn.textContent = "Save Player";
      showPlayersBtn.click();
    } else {
      gameIdInput.value = data._id;
      gameTitle.value = data.title;
      gameCode.value = data.code;
      gameFormTitle.textContent = "Edit Game";
      gameFormBtn.textContent = "Save Game";
      showGamesBtn.click();
    }
  }

  // Join Game (dropdown select)
  if (e.target.classList.contains("join")) {
    const playerId = e.target.dataset.playerId;
    if (allGames.length === 0) return alert("No games available.");
    const gameList = allGames.map((g, i) => `${i + 1}. ${g.title} (${g.code})`).join("\n");
    const choice = prompt(`Select a game number to join:\n\n${gameList}`);
    const game = allGames[Number(choice) - 1];
    if (!game) return alert("Invalid selection.");

    const res = await fetch(`${API_URL}/players/${playerId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: game._id }),
    });
    if (res.ok) fetchPlayers();
    else alert("Failed to join game");
  }

  // Leave Game (dropdown of joined games)
  if (e.target.classList.contains("leave")) {
    const playerId = e.target.dataset.playerId;
    const playerRes = await fetch(`${API_URL}/players/${playerId}`);
    const player = await playerRes.json();
    if (player.joinedGames.length === 0) return alert("No joined games to leave.");

    const joinedList = player.joinedGames.map((g, i) => `${i + 1}. ${g.title} (${g.code})`).join("\n");
    const choice = prompt(`Select a game number to leave:\n\n${joinedList}`);
    const selected = player.joinedGames[Number(choice) - 1];
    if (!selected) return alert("Invalid selection.");

    const res = await fetch(`${API_URL}/players/${playerId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: selected.gameId }),
    });
    if (res.ok) fetchPlayers();
    else alert("Failed to leave game");
  }
});

// === INITIAL LOAD ===
(async () => {
  await fetchGames();
  await fetchPlayers();
})();
