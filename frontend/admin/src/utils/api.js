export function buildApiUrl(base, path) {
  if (!base) return path;
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }
  return response.json();
}

export async function testConnection(base) {
  const url = buildApiUrl(base, 'api/health');
  const start = Date.now();
  const response = await fetchJson(url, { method: 'GET' });
  return { status: response.status || 'online', latency: Date.now() - start };
}
