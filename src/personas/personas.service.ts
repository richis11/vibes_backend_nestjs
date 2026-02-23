import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/connection';
import { personas, NuevaPersona, UpdatePersona } from '../db/schema_personas';
import { hosts } from 'src/db/schema_hosts';
import { like, or, eq, and, isNull } from 'drizzle-orm';
import cloudinary from '../config/cloudinary.config';
import { Readable } from 'stream';


@Injectable()
export class PersonasService {
  // // LISTAR PERSONAS (solo activas)
  // async obtenerPersonas() {
  //   return await db
  //     .select()
  //     .from(personas)
  //     .where(eq(personas.estado, 'activo'));
  // }
  // LISTAR PERSONAS
  async obtenerPersonas() {
    return await db.select().from(personas);
  }

  //BUSCAR USERS DISPONIBLES (NO TIENEN PERSONA CON FK)
  async obtenerPersonasDisponibles() {
    return await db
      .select({
        id: personas.id,
        nombres: personas.nombres,
        apellidos: personas.apellidos
      })
      .from(personas)
      .leftJoin(hosts, eq(personas.id, hosts.persona_id))
      .where(and(isNull(hosts.persona_id), eq(personas.estado, 'activo')));
  }

  // LISTAR POR ID
  async obtenerPersonaPorId(id: number) {
    const persona = await db
      .select()
      .from(personas)
      .where(and(eq(personas.id, id), eq(personas.estado, 'activo')))
      .limit(1);

    if (!persona.length) {
      throw new NotFoundException('Persona no encontrada');
    }

    return persona[0];
  }

  // BUSCAR PERSONAS
  async buscarPersonas(q: string, page: number = 1) {
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!q) {
      return this.obtenerPersonas();
    }

    return await db
      .select()
      .from(personas)
      .where(
        and(
          eq(personas.estado, 'activo'),
          or(like(personas.nombres, `%${q}%`), like(personas.cedula, `%${q}%`)),
        ),
      )
      .limit(limit)
      .offset(offset);
  }

  // CREAR PERSONA
  async crearPersona(data: NuevaPersona) {
    await db.insert(personas).values(data);
    return { message: 'Persona creada correctamente' };
  }

  // EDITAR PERSONA
  async actualizarPersona(id: number, data: UpdatePersona) {
    const result = await db
      .update(personas)
      .set(data)
      .where(eq(personas.id, id))
      .execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Persona no encontrada');
    }

    return { message: 'Persona actualizada correctamente' };
  }

  async subirFotoPerfil(id: number, file: Express.Multer.File) {
  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `vibes/perfiles`, resource_type: 'image' },
        (error, res) => {
          if (error || !res) return reject(error);
          resolve({ secure_url: res.secure_url, public_id: res.public_id });
        },
      );
      Readable.from(file.buffer).pipe(stream);
    },
  );

  await db.update(personas)
    .set({ foto_url: result.secure_url })
    .where(eq(personas.id, id));

  return { foto_url: result.secure_url };
}

  // SOFT DELETE
  //   async eliminarPersona(id: number) {
  //     const result = await db
  //       .update(personas)
  //       .set({
  //         estado: 'eliminado',
  //         deleted_at: new Date(),
  //       })
  //       .where(eq(personas.id, id))
  //       .execute();

  //     if (result[0].affectedRows === 0) {
  //       throw new NotFoundException('Persona no encontrada');
  //     }

  //     return { message: 'Persona eliminada correctamente' };
  //   }

  // ELIMINAR DEFINITIVO (delete físico por ahora)
  async eliminarPersona(id: number) {
    const result = await db
      .delete(personas)
      .where(eq(personas.id, id))
      .execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Persona no encontrado');
    }

    return { message: 'Persona eliminada correctamente' };
  }
}
