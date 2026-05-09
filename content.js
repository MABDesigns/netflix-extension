// content.js — runs inside the Netflix tab

let lastSent = null;

function getNetflixData() {
  // --- Title ---
  // Netflix renders the title in a few different selectors depending on UI version
  const titleEl =
    document.querySelector('.watch-title') ||
    document.querySelector('[data-uia="video-title"] h4') ||
    document.querySelector('.video-title h4') ||
    document.querySelector('.PlayerControlsNeo__title') ||
    document.querySelector('.ellipsize-text h4');

  const title = titleEl ? titleEl.innerText.trim() : null;

  // --- Episode / subtitle (season + episode label) ---
  const episodeEl =
    document.querySelector('[data-uia="video-title"] span') ||
    document.querySelector('.video-title span') ||
    document.querySelector('.PlayerControlsNeo__subtitle');

  const episode = episodeEl ? episodeEl.innerText.trim() : null;

  // --- Video element for time ---
  const video = document.querySelector('video');
  const currentTime = video ? Math.floor(video.currentTime) : 0;
  const duration = video ? Math.floor(video.duration) : 0;
  const paused = video ? video.paused : true;

  return { title, episode, currentTime, duration, paused };
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

function sendToServer(data) {
  const payload = JSON.stringify(data);
  if (payload === lastSent) return; // no change, skip
  lastSent = payload;

  fetch('http://localhost:6969/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  }).catch(() => {
    // Server not running — silently ignore
  });
}

// Poll every 5 seconds
setInterval(() => {
  const data = getNetflixData();
  if (data.title) {
    sendToServer(data);
  }
}, 5000);