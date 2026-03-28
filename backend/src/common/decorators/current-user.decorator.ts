import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  type JwtUserPayload,
  type RequestWithUser,
} from '../types/jwt.types.js';

export const CurrentUser = createParamDecorator(
  (field: keyof JwtUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return field ? request.user?.[field] : request.user;
  },
);
