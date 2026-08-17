const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Login session expired or was tampered with. Please try again.",
  token_exchange_failed: "WHOOP rejected the login request. Please try again.",
  access_denied: "You declined access on WHOOP.",
  whoop_api_failed: "Couldn't reach WHOOP with your saved connection. Please reconnect.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">WHOOP Dashboard</h1>
        <p className="mt-2 text-sm text-white/50">
          Your recovery, strain, and sleep data, in one place.
        </p>
      </div>

      {error && (
        <p className="max-w-sm rounded-lg border border-whoop-recovery-low/40 bg-whoop-recovery-low/10 px-4 py-3 text-center text-sm text-whoop-recovery-low">
          {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
        </p>
      )}

      <a
        href="/api/auth/login"
        className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
      >
        Connect WHOOP account
      </a>
    </main>
  );
}
