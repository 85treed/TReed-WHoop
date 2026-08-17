export function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        className="rounded-full border border-whoop-border px-4 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/30 hover:text-white"
      >
        Disconnect
      </button>
    </form>
  );
}
