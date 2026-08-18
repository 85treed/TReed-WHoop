// WHOOP redirects here with ?code=...&state=... after the user grants access.
// Exchanges the code for tokens (Client Secret lives only here, as an env var)
// and stores them in HttpOnly cookies — the frontend never touches raw tokens.
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

module.exports = async (req, res) => {
  const { WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, WHOOP_REDIRECT_URI } = process.env;
  if (!WHOOP_CLIENT_ID || !WHOOP_CLIENT_SECRET || !WHOOP_REDIRECT_URI) {
    res.status(500).send('Server missing WHOOP_CLIENT_ID / WHOOP_CLIENT_SECRET / WHOOP_REDIRECT_URI env vars');
    return;
  }

  const { code, state, error } = req.query || {};
  const cookies = parseCookies(req.headers.cookie);
  const expectedState = cookies.whoop_oauth_state;

  // Always clear the one-time state cookie
  const clearState = 'whoop_oauth_state=; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=0';

  if (error || !code || !state || state !== expectedState) {
    res.setHeader('Set-Cookie', clearState);
    res.writeHead(302, { Location: '/?whoop_error=1' });
    res.end();
    return;
  }

  const params = new URLSearchParams();
  params.set('grant_type', 'authorization_code');
  params.set('code', code);
  params.set('redirect_uri', WHOOP_REDIRECT_URI);
  params.set('client_id', WHOOP_CLIENT_ID);
  params.set('client_secret', WHOOP_CLIENT_SECRET);

  let tokenResp, tokenJson;
  try {
    tokenResp = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    tokenJson = await tokenResp.json();
  } catch (err) {
    res.setHeader('Set-Cookie', clearState);
    res.writeHead(302, { Location: '/?whoop_error=1' });
    res.end();
    return;
  }

  if (!tokenResp.ok || !tokenJson.access_token) {
    res.setHeader('Set-Cookie', clearState);
    res.writeHead(302, { Location: '/?whoop_error=1' });
    res.end();
    return;
  }

  const expiresAt = Date.now() + (tokenJson.expires_in || 3600) * 1000;
  const maxAgeRefresh = 60 * 60 * 24 * 30; // 30 days

  res.setHeader('Set-Cookie', [
    clearState,
    `whoop_access_token=${tokenJson.access_token}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${tokenJson.expires_in || 3600}`,
    `whoop_refresh_token=${tokenJson.refresh_token}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${maxAgeRefresh}`,
    `whoop_expires_at=${expiresAt}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${maxAgeRefresh}`,
    `whoop_connected=1; Path=/; SameSite=Lax; Max-Age=${maxAgeRefresh}`,
  ]);
  res.writeHead(302, { Location: '/?whoop_connected=1' });
  res.end();
};
