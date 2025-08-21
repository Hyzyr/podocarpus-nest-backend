import { UserRole } from '@prisma/client';

export type TokenPayload = {
  sub: string | number;
  role: UserRole;
};
