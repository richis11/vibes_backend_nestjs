import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { db } from '../db/connection';
import { users } from '../db/schema_users';
import { personas } from '../db/schema_personas';
import { eq } from 'drizzle-orm';
import { hosts } from '../db/schema_hosts';
import {
  esHashBcrypt,
  hashPassword,
  verificarPassword,
} from '../auth/password';

import { LoginDto } from './login.dto';

@Injectable()
export class LoginService {
  constructor(private readonly jwtService: JwtService) {}

  async login(data: LoginDto) {
    // 1. Buscar user por email
    const userFound = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (!userFound.length) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const user = userFound[0];

    // 2. Verificar que el user esté activo
    if (user.estado !== 'activo') {
      throw new UnauthorizedException('Usuario suspendido o eliminado');
    }

    // 3. Verificar password
    const passwordValid = await verificarPassword(
      data.password,
      user.password_hash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Migrar passwords antiguos en texto plano a bcrypt
    if (!esHashBcrypt(user.password_hash)) {
      await db
        .update(users)
        .set({ password_hash: await hashPassword(data.password) })
        .where(eq(users.id, user.id));
    }

    // 4. Buscar persona asociada
    const personaFound = await db
      .select()
      .from(personas)
      .where(eq(personas.user_id, user.id))
      .limit(1);

    const persona = personaFound[0] ?? null;

    const hostFound = await db
      .select({ id: hosts.id })
      .from(hosts)
      .where(eq(hosts.persona_id, persona?.id ?? 0))
      .limit(1);

    const hostId = hostFound[0]?.id ?? null;

    // 5. Generar JWT
    const payload = {
      sub: user.id,
      email: user.email,
      is_admin: user.is_admin,
      persona_id: persona?.id ?? null,
      host_id: hostId,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
        nombres: persona?.nombres ?? null,
        apellidos: persona?.apellidos ?? null,
        persona_id: persona?.id ?? null,
        host_id: hostId, // ← nuevo
      },
    };
  }
}
