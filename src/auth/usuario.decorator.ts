// src/auth/usuario.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Payload que firma LoginService
export interface UsuarioJwt {
  sub: number;
  email: string;
  is_admin: boolean;
  persona_id: number | null;
  host_id: number | null;
}

export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioJwt =>
    ctx.switchToHttp().getRequest().user,
);
