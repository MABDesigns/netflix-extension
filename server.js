// server.js — Netflix Discord Rich Presence server
// Replace CLIENT_ID with your Discord application's Client ID

const express = require('express');
const cors = require('cors');
const DiscordRPC = require('discord-rpc');

// ─── CONFIG ────────────────────────────────────────────────────────────────
const CLIENT_ID = 'CLIENT_ID'; // <-- paste your App's Client ID here
const PORT = 27843;
// ───────────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// Register discord-rpc client
DiscordRPC.register(CLIENT_ID);
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

let rpcReady = false;
let currentActivity = null;

// ─── DISCORD CONNECTION ─────────────────────────────────────────────────────

rpc.on('ready', () => {
  console.log(`✅ Discord RPC connected as: ${rpc.user.username}`);
  rpcReady = true;

  // If we received data before RPC was ready, push it now
  if (currentActivity) {
    pushActivity(currentActivity);
  }
});

async function connectRPC() {
  try {
    await rpc.login({ clientId: CLIENT_ID });
  } catch (err) {
    console.error('❌ Discord RPC connection failed:', err.message);
    console.log('   → Make sure Discord is running, then restart this server.');
    setTimeout(connectRPC, 10000); // retry every 10s
  }
}

connectRPC();

// ─── ACTIVITY HELPERS ───────────────────────────────────────────────────────

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

async function pushActivity(data) {
  if (!rpcReady) return;

  const { title, episode, currentTime, duration, paused } = data;

  const details = title || 'Watching Netflix';
  const state = episode
    ? episode
    : paused
    ? '⏸ Paused'
    : '▶ Playing';

  const activity = {
    details,          // top line  — show title
    state,            // 2nd line  — episode or play state
    largeImageKey: 'netflix_logo',   // set this in your Discord app's Art Assets
    largeImageText: 'Netflix',
    smallImageKey: paused ? 'pause_icon' : 'play_icon',
    smallImageText: paused ? 'Paused' : 'Playing',
    instance: false,
  };

  // Add timestamps so Discord shows elapsed/remaining time when playing
  if (!paused && duration > 0) {
    const now = Date.now();
    activity.startTimestamp = Math.floor(now / 1000) - currentTime;
    activity.endTimestamp = Math.floor(now / 1000) + (duration - currentTime);
  }

  try {
    await rpc.setActivity(activity);
    console.log(`🎬 Updated: "${details}" — ${episode || ''} [${formatTime(currentTime)} / ${formatTime(duration)}]`);
  } catch (err) {
    console.error('Failed to set activity:', err.message);
  }
}

async function clearActivity() {
  if (!rpcReady) return;
  try {
    await rpc.clearActivity();
    console.log('🔴 Cleared Discord activity (Netflix not playing)');
  } catch (err) {
    console.error('Failed to clear activity:', err.message);
  }
}

// ─── HTTP ENDPOINT (receives data from Firefox extension) ───────────────────

app.post('/update', async (req, res) => {
  const { title, episode, currentTime, duration, paused } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'No title received' });
  }

  currentActivity = { title, episode, currentTime, duration, paused };
  await pushActivity(currentActivity);
  res.json({ ok: true });
});

app.get('/clear', async (req, res) => {
  currentActivity = null;
  await clearActivity();
  res.json({ ok: true });
});

app.get('/status', (req, res) => {
  res.json({ rpcReady, currentActivity });
});

// ─── START ──────────────────────────────────────────────────────────────────

const https = require('https');
const fs = require('fs');

const sslOptions = {
  key: fs.readFileSync('C:\\Users\\User\\Desktop\\key.pem'),
  cert: fs.readFileSync('C:\\Users\\User\\Desktop\\cert.pem'),
}; 

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`\n🚀 Netflix RPC server running on https://localhost:${PORT}`);
  console.log(`   Waiting for Discord connection...\n`);
});
