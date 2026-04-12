const DEFAULT_TIMEOUT = 10000;

async function withTimeout(request, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(request.url, { ...request, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson(url, options = {}) {
  const response = await withTimeout({ url, ...options });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with ${response.status}`);
  }
  return response.json();
}

export function buildApiUrl(base, path) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export async function getWeather(apiBase, latitude, longitude) {
  if (!apiBase || apiBase.includes('YOUR_NGROK_URL')) {
    return null;
  }
  return fetchJson(buildApiUrl(apiBase, `weather?lat=${latitude}&lon=${longitude}`));
}

export async function getHazards(apiBase) {
  return fetchJson(buildApiUrl(apiBase, 'api/events?limit=100'));
}

export async function submitReport(apiBase, report) {
  if (!apiBase || apiBase.includes('YOUR_NGROK_URL')) {
    return { success: true, report };
  }
  return fetchJson(buildApiUrl(apiBase, 'api/report'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  });
}

export async function analyzeImage(apiBase, payload) {
  if (!apiBase || apiBase.includes('YOUR_NGROK_URL')) {
    return {
      detectedType: payload.type || 'Pothole',
      confidence: 0.87,
      suggestedSeverity: 'High',
      annotation: payload.imageUrl,
    };
  }
  return fetchJson(buildApiUrl(apiBase, 'api/predict-video-frame'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
