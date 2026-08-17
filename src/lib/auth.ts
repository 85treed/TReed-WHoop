import { getSession } from "./session";
import { getTokens } from "./db";

export interface CurrentUser {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session.whoopUserId) return null;

  const tokens = getTokens(session.whoopUserId);
  if (!tokens) return null;

  return {
    userId: tokens.userId,
    firstName: tokens.firstName,
    lastName: tokens.lastName,
    email: tokens.email,
  };
}
