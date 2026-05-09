<div align="center">

# 🎬 Netflix Discord RPC

**Show what you're watching on Netflix directly in your Discord status — in real time.**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)
![Firefox](https://img.shields.io/badge/Firefox-Extension-FF7139?style=flat-square&logo=firefox&logoColor=white)
![Discord](https://img.shields.io/badge/Discord-Rich%20Presence-5865F2?style=flat-square&logo=discord&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

</div>

---

## ✨ What it does

Netflix Discord RPC automatically detects what you're watching on Netflix (Firefox) and displays it as a **Rich Presence** activity on your Discord profile — including the show title, episode name, and a live playback timer.

```
🎬 Watching: Stranger Things
   📺 S4 E1 — The Hellfire Club
   ⏱ 00:42:17 remaining
```

---

## 🧩 How it works

```
Firefox Extension  ──► reads Netflix title, episode & timestamp
        │
        │  HTTP POST (localhost:6969)
        ▼
Node.js RPC Server ──► pushes activity to Discord via IPC
        │
        ▼
Discord Desktop App ──► displays Rich Presence on your profile
```

---

## 📋 Requirements

| Requirement | Version |
|---|---|
| [Node.js](https://nodejs.org) | 18 or newer |
| [Firefox](https://www.mozilla.org/firefox) | Any recent version |
| [Discord Desktop](https://discord.com/download) | Must be running |
| A Discord Application | [Create one here](https://discord.com/developers/applications) |

---

## 🚀 Setup

### 1. Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** and name it **Netflix**
3. Copy the **Client ID** from the General Information page
4. Go to **Rich Presence → Art Assets** and upload the following images:

| Asset Key | Description |
|---|---|
| `netflix_logo` | Netflix "N" logo (large image) |
| `play_icon` | Play button icon (small image) |
| `pause_icon` | Pause button icon (small image) |

---

### 2. Set up the Node.js Server

```bash
# Clone the repository
git clone https://github.com/your-username/netflix-discord-rpc.git
cd netflix-discord-rpc

# Install dependencies
cd netflix-rpc-server
npm install
```

Open `server.js` and paste your Discord **Client ID**:

```js
const CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID'; // ← replace this
```

Start the server (**make sure Discord is already open**):

```bash
node server.js
```

You should see:

```
🚀 Netflix RPC server running on http://localhost:6969
✅ Discord RPC connected as: YourUsername
```

---

### 3. Load the Firefox Extension

1. Open Firefox and navigate to `about:debugging`
2. Click **This Firefox** in the left sidebar
3. Click **Load Temporary Add-on...**
4. Browse to the `netflix-extension/` folder and select `manifest.json`

The extension is now active. It will silently poll the Netflix tab every 5 seconds.

---

### 4. Watch something on Netflix

Open [netflix.com](https://www.netflix.com) in Firefox and start playing any title. Your Discord status will update within **5 seconds**.

---

## 📁 Project Structure

```
netflix-discord-rpc/
├── netflix-rpc-server/
│   ├── server.js          # Express server + Discord RPC bridge
│   └── package.json
│
└── netflix-extension/
    ├── manifest.json       # Firefox extension manifest
    ├── content.js          # Reads Netflix playback data from the DOM
    └── background.js       # Required background script
```

---

## ⚙️ Configuration

All config lives at the top of `server.js`:

| Variable | Default | Description |
|---|---|---|
| `CLIENT_ID` | `YOUR_DISCORD_CLIENT_ID` | Your Discord app's Client ID |
| `PORT` | `6969` | Local port the server listens on |

The extension polls Netflix every **5 seconds** — you can adjust this in `content.js`:

```js
setInterval(() => { ... }, 5000); // change 5000 to your preferred interval (ms)
```

---

## 🔌 API Endpoints

The local server exposes a small REST API for debugging:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/update` | Receives playback data from the Firefox extension |
| `GET` | `/clear` | Clears the Discord activity manually |
| `GET` | `/status` | Returns current RPC connection state and activity |

---

## 🛠 Troubleshooting

**Discord RPC won't connect**
> Make sure the Discord desktop app is open *before* starting the Node.js server. The server retries the connection every 10 seconds automatically.

**Status not updating on Netflix**
> Confirm the Firefox extension loaded in `about:debugging`. Netflix occasionally updates its player UI — if selectors break, open the browser console on a Netflix watch page, inspect the player controls, and update the selectors in `content.js`.

**`ECONNREFUSED` errors in the extension console**
> This just means the Node.js server isn't running. Start it with `node server.js` and the errors will stop.

**Timer not showing**
> The countdown timer only appears when a video is actively playing and has a known duration. It disappears when paused — this is by design.

---

## 🤝 Contributing

Pull requests are welcome! If Netflix updates their player and the selectors break, feel free to open an issue or PR with the fix.

1. Fork the repo
2. Create a feature branch: `git checkout -b fix/player-selectors`
3. Commit your changes: `git commit -m 'fix: update Netflix DOM selectors'`
4. Push and open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ for people who want their Discord status to be as cinematic as their taste.

</div>