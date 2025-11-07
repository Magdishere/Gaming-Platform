import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, getDB } from "./db.js";
import { ObjectId } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from project root
app.use(express.static(__dirname));

// Connect to MongoDB
await connectDB();
const db = getDB();
const gamesCol = db.collection(process.env.GAMES_COLLECTION_NAME);
const playersCol = db.collection(process.env.PLAYERS_COLLECTION_NAME);

// === HEALTH CHECK ===
app.get("/api/health", (req, res) => res.json({ ok: true }));

// === GAMES CRUD ===
app.get("/api/games", async (req, res) => {
  const list = await gamesCol.find({}).sort({ title: 1 }).toArray();
  res.json(list);
});

app.get("/api/games/:id", async (req, res) => {
  const doc = await gamesCol.findOne({ _id: new ObjectId(req.params.id) });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});

app.post("/api/games", async (req, res) => {
  const { title, code } = req.body;
  if (!title || !code) return res.status(400).json({ error: "title and code are required" });
  const exists = await gamesCol.findOne({ code });
  if (exists) return res.status(409).json({ error: "Game code already exists" });
  const result = await gamesCol.insertOne({ title, code });
  const saved = await gamesCol.findOne({ _id: result.insertedId });
  res.status(201).json(saved);
});

app.put("/api/games/:id", async (req, res) => {
  const { title, code } = req.body;
  if (!title || !code) return res.status(400).json({ error: "title and code are required" });
  const result = await gamesCol.findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: { title, code } },
    { returnDocument: "after" }
  );
  if (!result) return res.status(404).json({ error: "Not found" });
  res.json(result);
});

app.delete("/api/games/:id", async (req, res) => {
  const id = req.params.id;
  const result = await gamesCol.deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
  await playersCol.updateMany({}, { $pull: { joinedGames: { gameId: id } } });
  res.json({ ok: true });
});

// === PLAYERS CRUD ===
app.get("/api/players", async (req, res) => {
  const { name } = req.query;
  const filter = name ? { name: { $regex: name, $options: "i" } } : {};
  const list = await playersCol.find(filter).sort({ name: 1 }).toArray();
  res.json(list);
});

app.get("/api/players/:id", async (req, res) => {
  const doc = await playersCol.findOne({ _id: new ObjectId(req.params.id) });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});

app.post("/api/players", async (req, res) => {
  const { name, email } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const result = await playersCol.insertOne({ name, email: email || null, joinedGames: [] });
  const saved = await playersCol.findOne({ _id: result.insertedId });
  res.status(201).json(saved);
});

app.put("/api/players/:id", async (req, res) => {
  const { name, email } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const result = await playersCol.findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: { name, email: email || null } },
    { returnDocument: "after" }
  );
  if (!result) return res.status(404).json({ error: "Not found" });
  res.json(result);
});

app.delete("/api/players/:id", async (req, res) => {
  const result = await playersCol.deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

// === JOIN / LEAVE ===
app.post("/api/players/:id/join", async (req, res) => {
  const playerId = req.params.id;
  const { gameId } = req.body;
  if (!gameId) return res.status(400).json({ error: "gameId is required" });
  const player = await playersCol.findOne({ _id: new ObjectId(playerId) });
  const game = await gamesCol.findOne({ _id: new ObjectId(gameId) });
  if (!player) return res.status(404).json({ error: "player not found" });
  if (!game) return res.status(404).json({ error: "game not found" });

  const already = await playersCol.findOne({
    _id: new ObjectId(playerId),
    "joinedGames.gameId": gameId
  });
  if (already) return res.status(409).json({ error: "Already Joined" });

  const embedded = {
    gameId: game._id.toString(),
    title: game.title,
    code: game.code,
    registeredAt: new Date().toISOString()
  };

  const updated = await playersCol.findOneAndUpdate(
    { _id: new ObjectId(playerId) },
    { $push: { joinedGames: embedded } },
    { returnDocument: "after" }
  );
  res.json(updated);
});

app.post("/api/players/:id/leave", async (req, res) => {
  const playerId = req.params.id;
  const { gameId } = req.body;
  if (!gameId) return res.status(400).json({ error: "gameId is required" });
  const player = await playersCol.findOne({ _id: new ObjectId(playerId) });
  if (!player) return res.status(404).json({ error: "player not found" });

  const updated = await playersCol.findOneAndUpdate(
    { _id: new ObjectId(playerId) },
    { $pull: { joinedGames: { gameId } } },
    { returnDocument: "after" }
  );
  res.json(updated);
});

// === DEMO SEED ===
app.post("/api/seed", async (req, res) => {
  const games = [
    { title: "Battle Quest", code: "BQ101" },
    { title: "Space Raiders", code: "SR202" },
    { title: "Mystic Legends", code: "ML303" },
    { title: "Zombie Survival", code: "ZS404" },
    { title: "Racing Thunder", code: "RT505" },
  ];

  const players = [
    { name: "Alex Rivera", email: "alex@example.com", joinedGames: [] },
    { name: "Jamie Chen", email: "jamie@example.com", joinedGames: [] },
    { name: "Morgan Lee", email: "morgan@example.com", joinedGames: [] },
  ];

  await gamesCol.deleteMany({});
  await playersCol.deleteMany({});
  await gamesCol.insertMany(games);
  await playersCol.insertMany(players);
  res.json({ ok: true });
});

// === SPA FALLBACK ===
app.use(express.static(path.join(__dirname, "../"))); // project root
app.get(/^\/.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html")); // points to project root
});

// === START SERVER ===
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🎮 Gaming API running at http://localhost:${port}`));
