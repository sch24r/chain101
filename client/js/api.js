export function logEvent(message) {
    fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: message })
    }).catch(err => console.error("Failed to log event:", err));
}

export function updateStats(action) {
    fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
    .then(() => fetchStats())
    .catch(err => console.error("Failed to update stats:", err));
}

export function fetchStats() {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        document.getElementById('blockCount').textContent = data.blocks || 0;
        document.getElementById('mineCount').textContent = data.mined || 0;
      })
      .catch(err => console.error("Failed to load stats:", err));
}
