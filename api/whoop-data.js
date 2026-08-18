// Fetches the latest WHOOP recovery/sleep/cycle record on behalf of the
// browser. Reads tokens from HttpOnly cookies, transparently refreshes an
// expired access token, and proxies to the real WHOOP API — so raw tokens
// and the Client Secret never reach the browser.
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return out;
}

const ENDPOINTS = {
  recovery: 'v1/recovery',
  sleep: 'v1/activity/sleep',
  cycle: 'v1/cycle',
  profile: 'v1/user/profile/basic',
};

async function refreshTokens(cookies) {
  const { WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET } = process.env;
  const params = new URLSearchParams();
  params.set('grant_type', 'refresh_token');
  params.set('refresh_token', cookies.whoop_refresh_token);
  params.set('client_id', WHOOP_CLIENT_ID);
  params.set('client_secret', WHOOP_CLIENT_SECRET);
  params.set('scope', 'offline read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement');

  const resp = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!resp.ok) return null;
  return resp.json();
}

module.exports = async (req, res) => {
  const type = (req.query || {}).type;
  const path = ENDPOINTS[type];
  if (!path) {
    res.status(400).json({ error: 'Unknown type. Use recovery, sleep, cycle, or profile.' });
    return;
  }

  const cookies = parseCookies(req.headers.cookie);
  if (!cookies.whoop_access_token && !cookies.whoop_refresh_token) {
    res.status(401).json({ error: 'Not connected' });
    return;
  }

  let accessToken = cookies.whoop_access_token;
  const expired = !accessToken || (cookies.whoop_expires_at && Date.now() > Number(cookies.whoop_expires_at) - 30000);
  const newCookies = [];

  if (expired) {
    if (!cookies.whoop_refresh_token) {
      res.status(401).json({ error: 'Session expired' });
      return;
    }
    const refreshed = await refreshTokens(cookies);
    if (!refreshed || !refreshed.access_token) {
      res.status(401).json({ error: 'Session expired' });
      return;
    }
    accessToken = refreshed.access_token;
    const expiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;
    const maxAgeRefresh = 60 * 60 * 24 * 30;
    newCookies.push(
      `whoop_access_token=${accessToken}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${refreshed.expires_in || 3600}`,
      `whoop_refresh_token=${refreshed.refresh_token || cookies.whoop_refresh_token}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${maxAgeRefresh}`,
      `whoop_expires_at=${expiresAt}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${maxAgeRefresh}`
    );
  }

  const url = `https://api.prod.whoop.com/developer/${path}?limit=1`;
  let apiResp, apiJson;
  try {
    apiResp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    apiJson = await apiResp.json();
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach WHOOP API' });
    return;
  }

  if (newCookies.length) res.setHeader('Set-Cookie', newCookies);

  if (!apiResp.ok) {
    res.status(apiResp.status).json(apiJson);
    return;
  }

  res.status(200).json(apiJson);
};
