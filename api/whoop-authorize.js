// Starts the WHOOP OAuth flow: sets a short-lived state cookie (CSRF check)
// and redirects the browser straight to WHOOP's consent screen.
// Client ID stays server-side — the frontend never needs to know it.
const crypto = require('crypto');

module.exports = (req, res) => {
  const { WHOOP_CLIENT_ID, WHOOP_REDIRECT_URI } = process.env;
  if (!WHOOP_CLIENT_ID || !WHOOP_REDIRECT_URI) {
    res.status(500).send('Server missing WHOOP_CLIENT_ID / WHOOP_REDIRECT_URI env vars');
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');

  res.setHeader('Set-Cookie',
    `whoop_oauth_state=${state}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=600`
  );

  const scope = [
    'read:recovery', 'read:sleep', 'read:cycles',
    'read:workout', 'read:profile', 'read:body_measurement', 'offline'
  ].join(' ');

  const url = new URL('https://api.prod.whoop.com/oauth/oauth2/auth');
  url.searchParams.set('client_id', WHOOP_CLIENT_ID);
  url.searchParams.set('redirect_uri', WHOOP_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);

  res.writeHead(302, { Location: url.toString() });
  res.end();
};
