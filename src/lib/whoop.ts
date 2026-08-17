import { getTokens, saveTokens, type StoredTokens } from "./db";
import type {
  Cycle,
  Paginated,
  Recovery,
  Sleep,
  UserBasicProfile,
  UserBodyMeasurement,
  WorkoutV2,
} from "./whoop-types";

const AUTH_BASE = "https://api.prod.whoop.com/oauth/oauth2";
const API_BASE = "https://api.prod.whoop.com/developer";

export const WHOOP_SCOPES = [
  "read:recovery",
  "read:cycles",
  "read:sleep",
  "read:workout",
  "read:profile",
  "read:body_measurement",
  "offline",
];

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

export function buildAuthorizeUrl(state: string): string {
  const url = new URL(`${AUTH_BASE}/auth`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env("WHOOP_CLIENT_ID"));
  url.searchParams.set("redirect_uri", env("WHOOP_REDIRECT_URI"));
  url.searchParams.set("scope", WHOOP_SCOPES.join(" "));
  url.searchParams.set("state", state);
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const res = await fetch(`${AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: env("WHOOP_CLIENT_ID"),
      client_secret: env("WHOOP_CLIENT_SECRET"),
      redirect_uri: env("WHOOP_REDIRECT_URI"),
    }),
  });
  if (!res.ok) {
    throw new Error(`WHOOP token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(`${AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env("WHOOP_CLIENT_ID"),
      client_secret: env("WHOOP_CLIENT_SECRET"),
      scope: WHOOP_SCOPES.join(" "),
    }),
  });
  if (!res.ok) {
    throw new Error(`WHOOP token refresh failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

const EXPIRY_SAFETY_MARGIN_MS = 60_000;

async function getValidAccessToken(userId: number): Promise<string> {
  const stored = getTokens(userId);
  if (!stored) throw new Error("No WHOOP tokens stored for this user. Please reconnect.");

  if (Date.now() < stored.expiresAt - EXPIRY_SAFETY_MARGIN_MS) {
    return stored.accessToken;
  }

  const refreshed = await refreshTokens(stored.refreshToken);
  const updated: StoredTokens = {
    ...stored,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresAt: Date.now() + refreshed.expires_in * 1000,
  };
  saveTokens(updated);
  return updated.accessToken;
}

async function whoopFetch<T>(userId: number, path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const accessToken = await getValidAccessToken(userId);
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`WHOOP API request to ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export interface RangeParams {
  start?: string;
  end?: string;
  limit?: number;
  nextToken?: string;
}

export function getProfile(userId: number) {
  return whoopFetch<UserBasicProfile>(userId, "/v2/user/profile/basic");
}

export function getBodyMeasurement(userId: number) {
  return whoopFetch<UserBodyMeasurement>(userId, "/v2/user/measurement/body");
}

export function getRecoveryCollection(userId: number, params: RangeParams = {}) {
  return whoopFetch<Paginated<Recovery>>(userId, "/v2/recovery", {
    start: params.start,
    end: params.end,
    limit: params.limit,
    nextToken: params.nextToken,
  });
}

export function getCycleCollection(userId: number, params: RangeParams = {}) {
  return whoopFetch<Paginated<Cycle>>(userId, "/v2/cycle", {
    start: params.start,
    end: params.end,
    limit: params.limit,
    nextToken: params.nextToken,
  });
}

export function getSleepCollection(userId: number, params: RangeParams = {}) {
  return whoopFetch<Paginated<Sleep>>(userId, "/v2/activity/sleep", {
    start: params.start,
    end: params.end,
    limit: params.limit,
    nextToken: params.nextToken,
  });
}

export function getWorkoutCollection(userId: number, params: RangeParams = {}) {
  return whoopFetch<Paginated<WorkoutV2>>(userId, "/v2/activity/workout", {
    start: params.start,
    end: params.end,
    limit: params.limit,
    nextToken: params.nextToken,
  });
}
