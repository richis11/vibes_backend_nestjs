import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../db/connection';
import { hosts } from '../db/schema_hosts';
import { like, or, eq, and } from 'drizzle-orm';
import {
  exigir,
  exigirCampos,
  hostIdDe,
  sinCamposDeAdmin,
} from '../auth/permisos';
import { UsuarioJwt } from '../auth/usuario.decorator';
import { CrearHostDto, UpdateHostDto } from './hosts.dto';

// Estos campos los maneja la plataforma (verificación, reputación, Stripe)
const CAMPOS_ADMIN: (keyof UpdateHostDto)[] = [
  'persona_id',
  'verificado',
  'rating',
  'estado',
  'stripe_account_id',
  'stripe_onboarding_completed',
];

async function exigirMismoHostOAdmin(id: number, usuario: UsuarioJwt) {
  exigir(usuario.is_admin || (await hostIdDe(usuario)) === id);
}

@Injectable()
export class HostsService {
  // LISTAR HOSTS (solo activos)
  async obtenerHosts() {
    return await db.select().from(hosts).where(eq(hosts.estado, 'activo'));
  }

  // LISTAR POR ID
  // Otros usuarios no ven los datos de Stripe
  async obtenerHostPorId(id: number, usuario: UsuarioJwt) {
    const host = await db
      .select()
      .from(hosts)
      .where(and(eq(hosts.id, id), eq(hosts.estado, 'activo')))
      .limit(1);

    if (!host.length) {
      throw new NotFoundException('Host no encontrado');
    }

    if (usuario.is_admin || (await hostIdDe(usuario)) === id) {
      return host[0];
    }

    const { stripe_account_id, stripe_onboarding_completed, ...publico } =
      host[0];
    return publico;
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
async crearHost(data: CrearHostDto, usuario: UsuarioJwt) {
  const persona_id = usuario.is_admin ? data.persona_id : usuario.persona_id;
  if (!persona_id) {
    throw new BadRequestException('persona_id es obligatorio');
  }

  const permitido = sinCamposDeAdmin(usuario, data, CAMPOS_ADMIN);
  const result = await db.insert(hosts).values({ ...permitido, persona_id });
  return { message: 'Host creado correctamente', host_id: result[0].insertId };
}

  // EDITAR HOST
  async actualizarHost(id: number, data: UpdateHostDto, usuario: UsuarioJwt) {
    await exigirMismoHostOAdmin(id, usuario);

    const permitido = sinCamposDeAdmin(usuario, data, CAMPOS_ADMIN);

    const result = await db
      .update(hosts)
      .set(exigirCampos(permitido))
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
  async eliminarHost(id: number, usuario: UsuarioJwt) {
    await exigirMismoHostOAdmin(id, usuario);

    const result = await db.delete(hosts).where(eq(hosts.id, id)).execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Host no encontrado');
    }

    return { message: 'Host eliminado correctamente' };
  }
}
