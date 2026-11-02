// src/casas/casas.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../db/connection';
import { casas } from '../db/schema_casas';
import { eq, sql } from 'drizzle-orm';
import { PineconeService } from '../pinecone/pinecone.service';
import {
  exigir,
  exigirCampos,
  exigirDuenoDeCasa,
  hostIdDe,
  sinCamposDeAdmin,
} from '../auth/permisos';
import { UsuarioJwt } from '../auth/usuario.decorator';
import { CrearCasaDto, UpdateCasaDto } from './casas.dto';

@Injectable()
export class CasasService {
  constructor(private readonly pineconeService: PineconeService) {}

  // ─── Listar todas ─────────────────────────────────────────────────────────
  async obtenerCasas() {
    return await db.select().from(casas);
  }

  // ─── Listar por ID ────────────────────────────────────────────────────────
  async obtenerCasaPorId(id: number) {
    const casa = await db.select().from(casas).where(eq(casas.id, id)).limit(1);
    if (!casa.length) throw new NotFoundException('Casa no encontrada');
    return casa[0];
  }

  // ─── Listar por host ──────────────────────────────────────────────────────
  async obtenerCasasPorHost(hostId: number) {
    return await db.select().from(casas).where(eq(casas.host_id, hostId));
  }

  // ─── Buscar ───────────────────────────────────────────────────────────────
  async buscarCasas(q: string, page = 1) {
    const limit = 10;
    const offset = (page - 1) * limit;
    return await db
      .select()
      .from(casas)
      .where(
        sql`MATCH(${casas.nombre}, ${casas.descripcion}, ${casas.direccion})
            AGAINST (${q} IN NATURAL LANGUAGE MODE)`,
      )
      .limit(limit)
      .offset(offset);
  }

  // ─── Crear ────────────────────────────────────────────────────────────────
  async crearCasa(data: CrearCasaDto, usuario: UsuarioJwt) {
    const host_id = usuario.is_admin ? data.host_id : await hostIdDe(usuario);
    if (!usuario.is_admin) {
      exigir(!!host_id, 'Debes ser anfitrión para publicar una casa');
    }
    if (!host_id) {
      throw new BadRequestException('host_id es obligatorio');
    }

    const result = await db.insert(casas).values({ ...data, host_id });
    const nuevaId = result[0].insertId;

    // Sincronizar con Pinecone
    const nueva = await this.obtenerCasaPorId(nuevaId);
    await this.pineconeService.upsertCasa(nueva).catch((e) =>
      console.error('[Pinecone] Error al crear casa:', e.message),
    );

    return { message: 'Casa creada correctamente', id: nuevaId };
  }

  // ─── Actualizar ───────────────────────────────────────────────────────────
  async actualizarCasa(id: number, data: UpdateCasaDto, usuario: UsuarioJwt) {
    await exigirDuenoDeCasa(id, usuario);

    const permitido = sinCamposDeAdmin(usuario, data, ['host_id']);
    const result = await db.update(casas).set(exigirCampos(permitido)).where(eq(casas.id, id)).execute();
    if (result[0].affectedRows === 0) throw new NotFoundException('Casa no encontrada');

    // Sincronizar con Pinecone
    const actualizada = await this.obtenerCasaPorId(id);
    await this.pineconeService.upsertCasa(actualizada).catch((e) =>
      console.error('[Pinecone] Error al actualizar casa:', e.message),
    );

    return { message: 'Casa actualizada correctamente' };
  }

  // ─── Eliminar ─────────────────────────────────────────────────────────────
  async eliminarCasa(id: number, usuario: UsuarioJwt) {
    await exigirDuenoDeCasa(id, usuario);

    const result = await db.delete(casas).where(eq(casas.id, id)).execute();
    if (result[0].affectedRows === 0) throw new NotFoundException('Casa no encontrada');

    // Eliminar de Pinecone
    await this.pineconeService.eliminarCasa(id).catch((e) =>
      console.error('[Pinecone] Error al eliminar casa:', e.message),
    );

    return { message: 'Casa eliminada correctamente' };
  }

  // ─── Sincronizar todas las casas con Pinecone ─────────────────────────────
  async sincronizarPinecone() {
    const todasLasCasas = await db.select().from(casas);
    return await this.pineconeService.sincronizarTodas(todasLasCasas);
  }
}


// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { db } from '../db/connection';
// import { casas, NuevaCasa } from '../db/schema_casas';
// import { eq, sql } from 'drizzle-orm';
// import { UpdateCasa } from '../db/schema_casas';

// // export interface Casa {
// //   id: number;
// //   host_id: number;
// //   nombre: string;
// //   descripcion: string;
// //   direccion: string;
// //   precio: string; // 🔹 cambiar de number a string
// //   disponibilidad: string;
// //   estado: string;
// //   created_at?: Date; // si Drizzle usa Date
// //   updated_at?: Date;
// //   deleted_at?: Date;
// // }

// @Injectable()
// // LISTAR CASAS
// export class CasasService {
//   async obtenerCasas() {
//     return await db.select().from(casas);
//   }

//   //LISTAR POR ID
//   async obtenerCasaPorId(id: number) {
//     const casa = await db.select().from(casas).where(eq(casas.id, id)).limit(1);

//     if (!casa.length) {
//       throw new NotFoundException('Casa no encontrada');
//     }

//     return casa[0];
//   }

//   //LISTAR POR HOST
//   async obtenerCasasPorHost(hostId: number) {
//   return await db
//     .select()
//     .from(casas)
//     .where(eq(casas.host_id, hostId));
// }

//   // BUSCAR CASAS
//   async buscarCasas(q: string, page = 1) {
//     const limit = 10;
//     const offset = (page - 1) * limit;

//     return await db
//       .select()
//       .from(casas)
//       .where(
//         sql`
//         MATCH(${casas.nombre}, ${casas.descripcion}, ${casas.direccion})
//         AGAINST (${q} IN NATURAL LANGUAGE MODE)
//       `,
//       )
//       .limit(limit)
//       .offset(offset);
//   }

//   // CREAR CASA
//   async crearCasa(data: NuevaCasa) {
//     await db.insert(casas).values(data);
//     return { message: 'Casa creada correctamente' };
//   }

//   //EDITAR CASA
//   async actualizarCasa(id: number, data: UpdateCasa) {
//     const result = await db
//       .update(casas)
//       .set(data)
//       .where(eq(casas.id, id))
//       .execute();

//     if (result[0].affectedRows === 0) {
//       throw new NotFoundException('Casa no encontrada');
//     }

//     return { message: 'Casa actualizada correctamente' };
//   }

//   // SOFT DELETE
//   // async eliminarCasa(id: number) {
//   //   const result = await db
//   //     .update(casas)
//   //     .set({
//   //       estado: 'eliminada',
//   //       deleted_at: new Date(),
//   //     })
//   //     .where(eq(casas.id, id))
//   //     .execute();

//   //   if (result[0].affectedRows === 0) {
//   //     throw new NotFoundException('Usuario no encontrada');
//   //   }

//   //   return { message: 'Usuario eliminado correctamente' };
//   // }

//   //ELIMINAR CASA
//   async eliminarCasa(id: number) {
//     const result = await db.delete(casas).where(eq(casas.id, id)).execute();

//     if (result[0].affectedRows === 0) {
//       throw new NotFoundException('Casa no encontrada');
//     }

//     return { message: 'Casa eliminada correctamente' };
//   }
// }
