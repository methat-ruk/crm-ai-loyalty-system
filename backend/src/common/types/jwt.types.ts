import { Request } from 'express';
import { Role } from '@prisma/client';

export interface JwtUserPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends Request {
  user: JwtUserPayload;
}
