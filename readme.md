<div align="center">

# 🎬 Netflix Discord RPC

**Show what you're watching on Netflix directly in your Discord status — in real time.**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)
![Edge](https://img.shields.io/badge/Microsoft%20Edge-Extension-0078D7?style=flat-square&logo=microsoft-edge&logoColor=white)
![Discord](https://img.shields.io/badge/Discord-Rich%20Presence-5865F2?style=flat-square&logo=discord&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

</div>

---

## ✨ What it does

Netflix Discord RPC automatically detects what you're watching on Netflix (Microsoft Edge) and displays it as a **Rich Presence** activity on your Discord profile — including the show title, episode name, and a live playback timer.

```
🎬 Watching: Lucifer
   📺 S1 E4 — Manly Whatnots
   ⏱ 23:09 / 42:09
```

---

## 🧩 How it works

```
Edge Extension     ──► accesses Netflix internal player API (window.netflix)
        │
        │  HTTPS POST (localhost:27843)
        ▼
Node.js RPC Server ──► pushes activity to Discord via IPC
        │
        ▼
Discord Desktop App ──► displays Rich Presence on your profile
```

> The extension runs in **MAIN world** context, meaning it has direct access to Netflix's internal JavaScript API (`window.netflix`) to reliably extract the title, episode, and playback state — no fragile DOM scraping.

---

## 📋 Requirements

| Requirement | Version |
|---|---|
| [Node.js](https://nodejs.org) | 18 or newer |
| [Microsoft Edge](https://www.microsoft.com/edge) | Any recent version |
| [Discord Desktop](https://discord.com/download) | Must be running |
| A Discord Application | [Create one here](https://discord.com/developers/applications) |
| OpenSSL or Node.js (`node-forge`) | For self-signed SSL certificate |

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

### 2. Generate a Self-Signed SSL Certificate

The server must run over **HTTPS** because Netflix blocks HTTP requests to localhost via its Content Security Policy.

**Option A — Git Bash / OpenSSL:**
```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
```

**Option B — Node.js (no OpenSSL needed):**

Create `generate-cert.js`:
```js
const forge = require('node-forge');
const fs = require('fs');

const pki = forge.pki;
const keys = pki.rsa.generateKeyPair(2048);
const cert = pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
const attrs = [{ name: 'commonName', value: 'localhost' }];
cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.sign(keys.privateKey);
fs.writeFileSync('cert.pem', pki.certificateToPem(cert));
fs.writeFileSync('key.pem', pki.privateKeyToPem(keys.privateKey));
console.log('✅ cert.pem and key.pem generated!');
```

```bash
npm install node-forge
node generate-cert.js
```

> ⚠️ Keep `key.pem` and `cert.pem` out of your server folder (if Edge refused the extension it's recommended to move em to Desktop. Try to update the path in server.js) — **never inside the extension folder**.

---

### 3. Set up the Node.js Server

```bash
# Clone the repository
git clone https://github.com/MABDesigns/netflix-extension.git
cd netflix-extension

# Install dependencies
npm install
```

Open `server.js` and configure:

```js
const CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID'; // ← paste your Discord app Client ID
const PORT = 27843;
```

Also update the certificate paths to match where you saved them:

```js
const sslOptions = {
  key: fs.readFileSync('C:\\Users\\YourName\\Desktop\\key.pem'),
  cert: fs.readFileSync('C:\\Users\\YourName\\Desktop\\cert.pem'),
};
```

Start the server (**make sure Discord is already open**):

```bash
node server.js
```

You should see:

```
🚀 Netflix RPC server running on https://localhost:27843
✅ Discord RPC connected as: YourUsername
```

---

### 4. Trust the SSL Certificate in Edge

1. Open Edge and go to `https://localhost:27843/status`
2. Click **Advanced → Continue to localhost (unsafe)**
3. You should see: `{"rpcReady":true,"currentActivity":null}`

> You only need to do this once. Without this step, Edge will silently block all requests to the local server.

---

### 5. Load the Edge Extension

1. Open Edge and go to `edge://extensions`
2. Enable **Developer mode** (bottom-left toggle)
3. Click **Load unpacked**
4. Select the `netflix-extension/` folder

The extension is now active and will poll Netflix every 5 seconds.

---

### 6. Watch something on Netflix

Open [netflix.com](https://www.netflix.com) in Edge and start playing any title. Your Discord status will update within **5 seconds**.

---

## 📁 Project Structure

```
netflix-extension/
├── server.js              # Express HTTPS server + Discord RPC bridge
├── package.json
├── generate-cert.js       # One-time SSL certificate generator (after you create it)
├── manifest.json      # Edge extension manifest (Manifest V3)
├── content.js         # Reads Netflix internal API & sends to server
└── background.js      # Service worker (required by MV3)
```

---

## ⚙️ Configuration

All config lives at the top of `server.js`:

| Variable | Default | Description |
|---|---|---|
| `CLIENT_ID` | `YOUR_DISCORD_CLIENT_ID` | Your Discord app's Client ID |
| `PORT` | `27843` | Local HTTPS port the server listens on |

The extension polls Netflix every **5 seconds** — you can adjust this in `content.js`:

```js
setInterval(() => { ... }, 5000); // change 5000 to your preferred interval (ms)
```

---

## 🔌 API Endpoints

The local server exposes a small REST API for debugging:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/update` | Receives playback data from the Edge extension |
| `GET` | `/clear` | Clears the Discord activity manually |
| `GET` | `/status` | Returns current RPC connection state and activity |

---

## 🛠 Troubleshooting

**Discord RPC won't connect**
> Make sure the Discord desktop app is open *before* starting the Node.js server. The server retries the connection every 10 seconds automatically.

**Status not updating on Netflix**
> Make sure you visited `https://localhost:27843/status` in Edge and accepted the certificate. Without this, all requests are silently blocked. Also confirm the extension is loaded in `edge://extensions`.

**`{"rpcReady":true,"currentActivity":null}` but nothing updates**
> Hard refresh the Netflix tab (`Ctrl+Shift+R`) after loading the extension, then play something and wait 5 seconds.

**Edge warning about `key.pem` in extension folder**
> Move `key.pem` and `cert.pem` out of the extension folder into your server folder. They should never be bundled with the extension.

**Edge popup on every launch asking to disable the extension**
> This is normal for unpacked Developer Mode extensions. To avoid it permanently, publish the extension to the Edge Add-ons store.

**Timer not showing**
> The countdown timer only appears when a video is actively playing and has a known duration. It disappears when paused — this is by design.

---

## 🤝 Contributing

Pull requests are welcome! If Netflix updates their internal API and the extension breaks, feel free to open an issue or PR with the fix.

1. Fork the repo
2. Create a feature branch: `git checkout -b fix/netflix-api`
3. Commit your changes: `git commit -m 'fix: update Netflix internal API access'`
4. Push and open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ for people who want their Discord status to be as cinematic as their taste.

</div>
