// Clears all WHOOP session cookies and sends the browser back to the dashboard.
module.exports = (req, res) => {
  const expired = 'Max-Age=0; Path=/; SameSite=Lax';
  res.setHeader('Set-Cookie', [
    `whoop_access_token=; HttpOnly; Secure; ${expired}`,
    `whoop_refresh_token=; HttpOnly; Secure; ${expired}`,
    `whoop_expires_at=; HttpOnly; Secure; ${expired}`,
    `whoop_connected=; ${expired}`,
  ]);
  res.writeHead(302, { Location: '/' });
  res.end();
};
