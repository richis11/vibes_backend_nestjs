import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/connection';
import { hosts, NuevoHost, UpdateHost } from '../db/schema_hosts';
import { like, or, eq, and } from 'drizzle-orm';

@Injectable()
export class HostsService {
  // LISTAR HOSTS (solo activos)
  async obtenerHosts() {
    return await db.select().from(hosts).where(eq(hosts.estado, 'activo'));
  }

  // LISTAR POR ID
  async obtenerHostPorId(id: number) {
    const host = await db
      .select()
      .from(hosts)
      .where(and(eq(hosts.id, id), eq(hosts.estado, 'activo')))
      .limit(1);

    if (!host.length) {
      throw new NotFoundException('Host no encontrado');
    }

    return host[0];
  }

  // BUSCAR HOSTS
  async buscarHosts(q: string, page: number = 1) {
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!q) {
      return this.obtenerHosts();
    }

    return await db
      .select()
      .from(hosts)
      .where(
        and(
          eq(hosts.estado, 'activo'),
          or(like(hosts.stripe_account_id, `%${q}%`)),
        ),
      )
      .limit(limit)
      .offset(offset);
  }

  //BUSCAR HOSTS DISPONIBLES (NO TIENEN CASAS CON FK)
    // async obtenerUsersDisponibles() {
    //   return await db
    //     .select({
    //       id: hosts.id,
    //       email: hosts.email,
    //     })
    //     .from(usehostsrs)
    //     .leftJoin(personas, eq(hosts.id, casas.user_id))
    //     .where(and(isNull(casas.host_id), eq(hosts.estado, "activo")));
    // }

  // CREAR HOST
  async crearHost(data: NuevoHost) {
    await db.insert(hosts).values(data);
    return { message: 'Host creado correctamente' };
  }

  // EDITAR HOST
  async actualizarHost(id: number, data: UpdateHost) {
    const result = await db
      .update(hosts)
      .set(data)
      .where(eq(hosts.id, id))
      .execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Host no encontrado');
    }

    return { message: 'Host actualizado correctamente' };
  }

  // SOFT DELETE
  //   async eliminarHost(id: number) {
  //     const result = await db
  //       .update(hosts)
  //       .set({
  //         estado: 'eliminado',
  //         deleted_at: new Date(),
  //       })
  //       .where(eq(hosts.id, id))
  //       .execute();

  //     if (result[0].affectedRows === 0) {
  //       throw new NotFoundException('Host no encontrado');
  //     }

  //     return { message: 'Host eliminado correctamente' };
  //   }

  // ELIMINAR HOST (delete físico por ahora)
  async eliminarHost(id: number) {
    const result = await db.delete(hosts).where(eq(hosts.id, id)).execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Host no encontrado');
    }

    return { message: 'Host eliminado correctamente' };
  }
}
