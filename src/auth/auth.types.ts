import { UserRole } from '@prisma/client';

export type TokenType = 'access' | 'refresh';

export type TokenPayload = {
  sub: string | number;
  role: UserRole;
  // Distinguishes access from refresh tokens so one can never be used in
  // place of the other. Absent on tokens issued before this claim existed;
  // such tokens are treated as access tokens only.
  type?: TokenType;
  // Random id so two refresh tokens for the same user are never identical
  // (same sub/role/iat would otherwise produce the same JWT). Gives each
  // token its own DB session row.
  jti?: string;
};
