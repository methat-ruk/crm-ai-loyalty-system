import { Request } from 'express';
import { Role } from '../../../generated/prisma/index.js';

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
