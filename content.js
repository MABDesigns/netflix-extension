// content.js — runs inside the Netflix tab
// Injects a script into the PAGE context to access window.netflix

function injectScript() {
  const script = document.createElement('script');
  script.id = 'netflix-rpc-injected';
  script.textContent = `
    (function() {
      function getNetflixData() {
        try {
          const api = window.netflix?.appContext?.state?.playerApp?.getAPI?.();
          if (!api) return null;

          const vp = api.videoPlayer;
          const sid = vp?.getAllPlayerSessionIds?.()[0];
          if (!sid) return null;

          const videoId = api.getVideoIdBySessionId(sid);
          if (!videoId) return null;

          const meta = api.getVideoMetadataByVideoId(videoId);
          const obj = meta?._metadataObject;
          if (!obj) return null;

          const title = obj.video.title || null;
          let episode = null;

          const currentEpId = obj.video.currentEpisode;
          if (currentEpId && obj.video.seasons) {
            for (const season of obj.video.seasons) {
              for (const ep of season.episodes) {
                if (ep.id === currentEpId) {
                  episode = 'S' + season.seq + ' E' + ep.seq + ' — ' + ep.title;
                  break;
                }
              }
            }
          }

          const video = document.querySelector('video');
          const currentTime = video ? Math.floor(video.currentTime) : 0;
          const duration = video ? Math.floor(video.duration) : 0;
          const paused = video ? video.paused : true;

          return { title, episode, currentTime, duration, paused };
        } catch(e) {
          return null;
        }
      }

      setInterval(() => {
        const data = getNetflixData();
        if (data && data.title) {
          window.dispatchEvent(new CustomEvent('netflix-rpc-data', { detail: data }));
        }
      }, 5000);
    })();
  `;
  document.documentElement.appendChild(script);
}

// Listen for data dispatched from the injected script
let lastSent = null;
window.addEventListener('netflix-rpc-data', (e) => {
  const data = e.detail;
  const payload = JSON.stringify(data);
  if (payload === lastSent) return;
  lastSent = payload;

  fetch('https://localhost:27843/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  }).catch(() => {});
});

// Inject when DOM is ready
if (document.documentElement) {
  injectScript();
} else {
  document.addEventListener('DOMContentLoaded', injectScript);
}

// Re-inject on SPA navigation
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    lastSent = null;
  }
}).observe(document.body, { subtree: true, childList: true });
