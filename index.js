const API_URL = "https://gaming-platform-api-gq4p.onrender.com/api";

// DOM elements
const showPlayersBtn = document.getElementById("showPlayersBtn");
const showGamesBtn = document.getElementById("showGamesBtn");
const playersSection = document.getElementById("playersSection");
const gamesSection = document.getElementById("gamesSection");

const playerForm = document.getElementById("playerForm");
const playerName = document.getElementById("playerName");
const playerEmail = document.getElementById("playerEmail");
const playersTableBody = document.getElementById("playersTableBody");
const playerFormTitle = document.getElementById("playerFormTitle");

const gameForm = document.getElementById("gameForm");
const gameTitle = document.getElementById("gameTitle");
const gameCode = document.getElementById("gameCode");
const gamesTableBody = document.getElementById("gamesTableBody");
const gameFormTitle = document.getElementById("gameFormTitle");

let allGames = [];
let editingPlayer = null;
let editingGame = null;

// Toggle sections
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

// Fetch data
async function fetchGames() {
  const res = await fetch(`${API_URL}/games`);
  allGames = await res.json();
  gamesTableBody.innerHTML = allGames.map(g => `
    <tr>
      <td data-label="Title">${g.title}</td>
      <td data-label="Code">${g.code}</td>
      <td class="actions" data-label="Actions">
        <button class="edit" data-id="${g._id}" data-type="game">Edit</button>
        <button class="delete" data-id="${g._id}" data-type="game">Delete</button>
      </td>
    </tr>
  `).join("");
}

async function fetchPlayers() {
  const res = await fetch(`${API_URL}/players`);
  const players = await res.json();
  playersTableBody.innerHTML = players.map(p => `
    <tr>
      <td data-label="Name">${p.name}</td>
      <td data-label="Email">${p.email || ""}</td>
      <td data-label="Joined Games">${p.joinedGames.map(g => g.title).join(", ") || "-"}</td>
      <td class="actions" data-label="Actions">
        <button class="join" data-id="${p._id}">Join</button>
        <button class="leave" data-id="${p._id}">Leave</button>
        <button class="edit" data-id="${p._id}" data-type="player">Edit</button>
        <button class="delete" data-id="${p._id}" data-type="player">Delete</button>
      </td>
    </tr>
  `).join("");
}

// Add / Edit Player
playerForm.addEventListener("submit", async e => {
  e.preventDefault();
  const data = { name: playerName.value.trim(), email: playerEmail.value.trim() };
  if (!data.name) return alert("Name is required");

  let res;
  if (editingPlayer) {
    res = await fetch(`${API_URL}/players/${editingPlayer}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } else {
    res = await fetch(`${API_URL}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  }

  if (res.ok) {
    editingPlayer = null;
    playerForm.reset();
    playerFormTitle.textContent = "Add New Player";
    fetchPlayers();
  } else {
    alert("Failed to save player");
  }
});

// Add / Edit Game
gameForm.addEventListener("submit", async e => {
  e.preventDefault();
  const data = { title: gameTitle.value.trim(), code: gameCode.value.trim() };
  if (!data.title || !data.code) return alert("Title and code are required");

  let res;
  if (editingGame) {
    res = await fetch(`${API_URL}/games/${editingGame}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } else {
    res = await fetch(`${API_URL}/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  }

  if (res.ok) {
    editingGame = null;
    gameForm.reset();
    gameFormTitle.textContent = "Add New Game";
    fetchGames();
  } else {
    alert("Failed to save game");
  }
});

// Click actions
document.addEventListener("click", async e => {
  const id = e.target.dataset.id;

  if (e.target.classList.contains("delete")) {
    const type = e.target.dataset.type;
    if (!confirm(`Delete this ${type}?`)) return;
    await fetch(`${API_URL}/${type}s/${id}`, { method: "DELETE" });
    type === "game" ? fetchGames() : fetchPlayers();
  }

  if (e.target.classList.contains("edit")) {
    const type = e.target.dataset.type;
    if (type === "player") {
      const res = await fetch(`${API_URL}/players/${id}`);
      const player = await res.json();
      playerName.value = player.name;
      playerEmail.value = player.email || "";
      editingPlayer = id;
      playerFormTitle.textContent = "Edit Player";
      showPlayersBtn.click();
    } else {
      const res = await fetch(`${API_URL}/games/${id}`);
      const game = await res.json();
      gameTitle.value = game.title;
      gameCode.value = game.code;
      editingGame = id;
      gameFormTitle.textContent = "Edit Game";
      showGamesBtn.click();
    }
  }

  if (e.target.classList.contains("join")) {
    const code = prompt("Enter game code to join:");
    if (!code) return;
    const resGames = await fetch(`${API_URL}/games`);
    const games = await resGames.json();
    const game = games.find(g => g.code === code.trim());
    if (!game) return alert("Invalid game code");

    await fetch(`${API_URL}/players/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: game._id })
    });
    fetchPlayers();
  }

  if (e.target.classList.contains("leave")) {
    const code = prompt("Enter game code to leave:");
    if (!code) return;
    const playerRes = await fetch(`${API_URL}/players/${id}`);
    const player = await playerRes.json();
    const joined = player.joinedGames.find(g => g.code === code.trim());
    if (!joined) return alert("You are not in that game");

    await fetch(`${API_URL}/players/${id}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: joined.gameId })
    });
    fetchPlayers();
  }
});

// Initial load
(async () => {
  await fetchGames();
  fetchPlayers();
})();
