import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/connection';
import { users } from '../db/schema_users';
import { personas } from '../db/schema_personas';
import { like, or, eq, isNull,and, getTableColumns } from 'drizzle-orm';
import { hashPassword } from '../auth/password';
import { exigir, exigirCampos, sinCamposDeAdmin } from '../auth/permisos';
import { UsuarioJwt } from '../auth/usuario.decorator';
import { CrearUserDto, UpdateUserDto } from './users.dto';

// Columnas públicas: nunca devolver password_hash
const { password_hash: _omit, ...userPublico } = getTableColumns(users);

async function hashearPassword<T extends { password_hash?: string }>(data: T) {
  if (data.password_hash) {
    return { ...data, password_hash: await hashPassword(data.password_hash) };
  }
  return data;
}

function exigirMismoUserOAdmin(id: number, usuario: UsuarioJwt) {
  exigir(usuario.is_admin || usuario.sub === id);
}

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
    return await db.select(userPublico).from(users);
  }

  // LISTAR POR ID
  async obtenerUserPorId(id: number, usuario: UsuarioJwt) {
    exigirMismoUserOAdmin(id, usuario);

    const user = await db.select(userPublico).from(users).where(eq(users.id, id)).limit(1);

    if (!user.length) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user[0];
  }

  //BUSCAR USERS DISPONIBLES (NO TIENEN PERSONA CON FK)
  async obtenerUsersDisponibles() {
    return await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .leftJoin(personas, eq(users.id, personas.user_id))
      .where(and(isNull(personas.user_id), eq(users.estado, "activo")));
  }

  // BUSCAR USERS
  async buscarUsers(q: string, page: number = 1) {
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!q) {
      return this.obtenerUsers();
    }

    return await db
      .select(userPublico)
      .from(users)
      .where(or(like(users.email, `%${q}%`)))
      .limit(limit)
      .offset(offset);
  }

  // CREAR USER
  async crearUser(data: CrearUserDto) {
    await db.insert(users).values(await hashearPassword(data));
    return { message: 'Usuario creado correctamente' };
  }

  // EDITAR USER
  async actualizarUser(id: number, data: UpdateUserDto, usuario: UsuarioJwt) {
    exigirMismoUserOAdmin(id, usuario);

    const permitido = sinCamposDeAdmin(usuario, data, [
      'is_admin',
      'estado',
      'stripe_customer_id',
    ]);

    const result = await db
      .update(users)
      .set(exigirCampos(await hashearPassword(permitido)))
      .where(eq(users.id, id))
      .execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return { message: 'Usuario actualizado correctamente' };
  }

  // SOFT DELETE
  // async eliminarUser(id: number) {
  //   const result = await db
  //     .update(users)
  //     .set({
  //       estado: 'eliminado',
  //       deleted_at: new Date(),
  //     })
  //     .where(eq(users.id, id))
  //     .execute();

  //   if (result[0].affectedRows === 0) {
  //     throw new NotFoundException('Usuario no encontrada');
  //   }

  //   return { message: 'Usuario eliminado correctamente' };
  // }

  // ELIMINAR USER (delete físico por ahora)
  async eliminarUser(id: number, usuario: UsuarioJwt) {
    exigirMismoUserOAdmin(id, usuario);

    const result = await db.delete(users).where(eq(users.id, id)).execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return { message: 'Usuario eliminado correctamente' };
  }
}
