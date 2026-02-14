import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/connection';
import { users, NuevoUser, UpdateUser } from '../db/schema_users';
import { like, or, eq } from 'drizzle-orm';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  is_admin: boolean;
  stripe_customer_id?: string;
  estado: 'activo' | 'suspendido' | 'eliminado';
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

@Injectable()
export class UsersService {
  // LISTAR USERS
  async obtenerUsers() {
    return await db.select().from(users);
  }

  // LISTAR POR ID
  async obtenerUserPorId(id: number) {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (!user.length) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user[0];
  }

  // BUSCAR USERS
  async buscarUsers(q: string, page: number = 1) {
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!q) {
      return this.obtenerUsers();
    }

    return await db
      .select()
      .from(users)
      .where(or(like(users.email, `%${q}%`)))
      .limit(limit)
      .offset(offset);
  }

  // CREAR USER
  async crearUser(data: NuevoUser) {
    await db.insert(users).values(data);
    return { message: 'Usuario creado correctamente' };
  }

  // EDITAR USER
  async actualizarUser(id: number, data: UpdateUser) {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return { message: 'Usuario actualizado correctamente' };
  }

  // ELIMINAR USER (delete físico por ahora)
  async eliminarUser(id: number) {
    const result = await db.delete(users).where(eq(users.id, id)).execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return { message: 'Usuario eliminado correctamente' };
  }
}
