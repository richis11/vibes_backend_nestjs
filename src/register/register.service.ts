import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { db } from '../db/connection';
import { users } from '../db/schema_users';
import { personas } from '../db/schema_personas';
import { eq } from 'drizzle-orm';
// import * as bcrypt from 'bcrypt'; // npm install bcrypt @types/bcrypt

export interface RegisterDto {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: Date; // o Date, según tu schema
}

@Injectable()
export class RegisterService {
  async register(data: RegisterDto) {
    // 1. Verificar si el email ya existe
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException('El email ya está registrado');
    }

    // 2. Transacción: crear user y persona de forma atómica
    await db.transaction(async (tx) => {
      const password_hash = data.password;

      const userResult = await tx
        .insert(users)
        .values({
          email: data.email,
          password_hash,
        })
        .execute();

      const newUserId = userResult[0].insertId;

      if (!newUserId) {
        tx.rollback();
        throw new InternalServerErrorException('Error al crear el usuario');
      }

      await tx.insert(personas).values({
        user_id: newUserId,
        nombres: data.nombres,
        apellidos: data.apellidos,
        fecha_nacimiento: new Date(data.fecha_nacimiento),
      });
    });

    return { message: 'Usuario registrado correctamente' };
  }
}
