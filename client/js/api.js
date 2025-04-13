const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Update DOM with stats data
function updateStatsDisplay(data) {
  document.getElementById('blockCount').textContent = data.blocks || 0;
  document.getElementById('mineCount').textContent = data.mined || 0;
}

// Fetch stats only (internal helper)
function fetchStatsOnly() {
  return fetch('/api/stats')
    .then(res => res.json())
    .then(data => {
      updateStatsDisplay(data);
      return data;
    });
}

// Main function that handles both updating and fetching stats
export function updateStats(action, count = 1) {
  if (!action) {
    return fetchStatsOnly().catch(() => {});
  }
  
  // Otherwise, update stats on server then display
  return fetch('/api/stats', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ action, count })
  })
  .then(res => res.json())
  .then(data => {
    updateStatsDisplay(data);
    return data;
  })
  .catch(() => {
    fetchStatsOnly().catch(() => {});
  });
}

export const fetchStats = () => updateStats();

export async function fetchSessionID() {
  try {
      const response = await fetch('/api/blocks');
      return response.ok ? response.headers.get('X-Session-ID') : null;
  } catch {
      return null;
  }
}

export async function fetchBlocks() {
    try {
        const response = await fetch('/api/blocks');
        return response.ok ? await response.json() : [];
    } catch {
        return [];
    }
}

export function saveBlocks(blocks) {
    fetch('/api/blocks', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(blocks),
    })
    .catch(() => {});
}

export function logEvent(message) {
  fetch('/api/logs', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ event: message })
  }).catch(() => {});
}
