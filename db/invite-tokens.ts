import { nanoid } from 'nanoid';

export type InviteTokenType = 'coach' | 'agency' | 'client';

export interface InviteToken {
  token: string;
  email: string;
  role: InviteTokenType;
  expiresAt: Date;
  createdAt: Date;
}

const tokens = new Map<string, InviteToken>();

export function createInviteToken(email: string, role: InviteTokenType): InviteToken {
  const token = nanoid(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
  
  const inviteToken: InviteToken = {
    token,
    email,
    role,
    expiresAt,
    createdAt: new Date(),
  };
  
  tokens.set(token, inviteToken);
  return inviteToken;
}

export function getInviteToken(token: string): InviteToken | null {
  const inviteToken = tokens.get(token);
  
  if (!inviteToken) {
    return null;
  }
  
  // Check if token has expired
  if (inviteToken.expiresAt < new Date()) {
    tokens.delete(token);
    return null;
  }
  
  return inviteToken;
}

export function isTokenValid(token: string): boolean {
  return getInviteToken(token) !== null;
}

export function markTokenUsed(token: string): boolean {
  const exists = tokens.has(token);
  if (exists) {
    tokens.delete(token);
  }
  return exists;
}

export function cleanupExpiredTokens(): number {
  const now = new Date();
  let cleaned = 0;
  
  for (const [token, inviteToken] of tokens.entries()) {
    if (inviteToken.expiresAt < now) {
      tokens.delete(token);
      cleaned++;
    }
  }
  
  return cleaned;
}