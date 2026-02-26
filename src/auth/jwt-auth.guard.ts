// src/auth/jwt-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('No se proporcionó token de autenticación');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload; // Guardar info del usuario en la request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}