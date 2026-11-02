// src/auth/jwt-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, SOLO_ADMIN_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('No se proporcionó token de autenticación');
    }

    const token = authHeader.replace('Bearer ', '');

    let payload;
    try {
      payload = this.jwtService.verify(token);
      request.user = payload; // Guardar info del usuario en la request
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const soloAdmin = this.reflector.getAllAndOverride<boolean>(
      SOLO_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (soloAdmin && !payload.is_admin) {
      throw new ForbiddenException('Solo un administrador puede hacer esto');
    }

    return true;
  }
}