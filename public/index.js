// ---------- Selectors ----------
const playersSection = document.getElementById("playersSection");
const gamesSection = document.getElementById("gamesSection");

const showPlayersBtn = document.getElementById("showPlayersBtn");
const showGamesBtn = document.getElementById("showGamesBtn");

// ---------- Player Elements ----------
const playerForm = document.getElementById("playerForm");
const playersTableBody = document.getElementById("playersTableBody");

// ---------- Game Elements ----------
const gameForm = document.getElementById("gameForm");
const gamesTableBody = document.getElementById("gamesTableBody");

// ---------- API URLs ----------
const PLAYERS_API = "/api/players";
const GAMES_API = "/api/games";

// ---------- Toggle Sections ----------
showPlayersBtn.addEventListener("click", () => {
  showPlayersBtn.classList.add("active");
  showGamesBtn.classList.remove("active");
  playersSection.classList.remove("hidden");
  gamesSection.classList.add("hidden");
  loadPlayers();
});

showGamesBtn.addEventListener("click", () => {
  showGamesBtn.classList.add("active");
  showPlayersBtn.classList.remove("active");
  gamesSection.classList.remove("hidden");
  playersSection.classList.add("hidden");
  loadGames();
});

// ---------- PLAYERS ----------
async function loadPlayers() {
  const res = await fetch(PLAYERS_API);
  const players = await res.json();
  playersTableBody.innerHTML = "";

  players.forEach(player => {
    const joinedGames = player.joinedGames?.map(g => g.title).join(", ") || "None";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${player.name}</td>
      <td>${player.email}</td>
      <td>${joinedGames}</td>
      <td class="actions">
        <button class="edit" onclick="joinGamePrompt('${player._id}')">Join Game</button>
        <button class="edit" onclick="leaveGamePrompt('${player._id}')">Leave Game</button>
        <button class="delete" onclick="deletePlayer('${player._id}')">Delete</button>
      </td>
    `;
    playersTableBody.appendChild(row);
  });
}

playerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newPlayer = {
    name: document.getElementById("playerName").value,
    email: document.getElementById("playerEmail").value
  };

  const res = await fetch(PLAYERS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newPlayer)
  });

  if (res.ok) {
    playerForm.reset();
    loadPlayers();
  } else {
    alert("Failed to add player");
  }
});

async function deletePlayer(id) {
  if (!confirm("Are you sure you want to delete this player?")) return;
  const res = await fetch(`${PLAYERS_API}/${id}`, { method: "DELETE" });
  if (res.ok) loadPlayers();
  else alert("Failed to delete player");
}

async function joinGamePrompt(playerId) {
  const gameCode = prompt("Enter Game Code to join:");
  if (!gameCode) return;

  const res = await fetch(`${PLAYERS_API}/${playerId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameCode })
  });

  if (res.ok) loadPlayers();
  else alert("Failed to join game (check code).");
}

async function leaveGamePrompt(playerId) {
  const gameCode = prompt("Enter Game Code to leave:");
  if (!gameCode) return;

  const res = await fetch(`${PLAYERS_API}/${playerId}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameCode })
  });

  if (res.ok) loadPlayers();
  else alert("Failed to leave game (check code).");
}

// ---------- GAMES ----------
async function loadGames() {
  const res = await fetch(GAMES_API);
  const games = await res.json();
  gamesTableBody.innerHTML = "";

  games.forEach(game => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${game.title}</td>
      <td>${game.code}</td>
      <td class="actions">
        <button class="delete" onclick="deleteGame('${game._id}')">Delete</button>
      </td>
    `;
    gamesTableBody.appendChild(row);
  });
}

gameForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newGame = {
    title: document.getElementById("gameTitle").value,
    code: document.getElementById("gameCode").value
  };

  const res = await fetch(GAMES_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newGame)
  });

  if (res.ok) {
    gameForm.reset();
    loadGames();
  } else {
    alert("Failed to add game");
  }
});

async function deleteGame(id) {
  if (!confirm("Are you sure you want to delete this game?")) return;
  const res = await fetch(`${GAMES_API}/${id}`, { method: "DELETE" });
  if (res.ok) loadGames();
  else alert("Failed to delete game");
}

// Load players by default
document.addEventListener("DOMContentLoaded", loadPlayers);
