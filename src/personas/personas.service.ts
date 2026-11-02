import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../db/connection';
import { personas } from '../db/schema_personas';
import { hosts } from '../db/schema_hosts';
import { like, or, eq, and, isNull } from 'drizzle-orm';
import cloudinary from '../config/cloudinary.config';
import { Readable } from 'stream';
import { exigir, exigirCampos, sinCamposDeAdmin } from '../auth/permisos';
import { UsuarioJwt } from '../auth/usuario.decorator';
import { CrearPersonaDto, UpdatePersonaDto } from './personas.dto';

function esMismaPersonaOAdmin(id: number, usuario: UsuarioJwt) {
  return usuario.is_admin || usuario.persona_id === id;
}


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
  // Otros usuarios solo ven datos públicos (sin cédula, teléfono, dirección)
  async obtenerPersonaPorId(id: number, usuario: UsuarioJwt) {
    const persona = await db
      .select()
      .from(personas)
      .where(and(eq(personas.id, id), eq(personas.estado, 'activo')))
      .limit(1);

    if (!persona.length) {
      throw new NotFoundException('Persona no encontrada');
    }

    if (esMismaPersonaOAdmin(id, usuario)) {
      return persona[0];
    }

    const { id: personaId, nombres, apellidos, foto_url } = persona[0];
    return { id: personaId, nombres, apellidos, foto_url };
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
  async crearPersona(data: CrearPersonaDto, usuario: UsuarioJwt) {
    const user_id = usuario.is_admin ? data.user_id : usuario.sub;
    if (!user_id) {
      throw new BadRequestException('user_id es obligatorio');
    }

    const permitido = sinCamposDeAdmin(usuario, data, ['estado']);
    await db.insert(personas).values({ ...permitido, user_id });
    return { message: 'Persona creada correctamente' };
  }

  // EDITAR PERSONA
  async actualizarPersona(
    id: number,
    data: UpdatePersonaDto,
    usuario: UsuarioJwt,
  ) {
    exigir(esMismaPersonaOAdmin(id, usuario));

    const permitido = sinCamposDeAdmin(usuario, data, ['user_id', 'estado']);

    const result = await db
      .update(personas)
      .set(exigirCampos(permitido))
      .where(eq(personas.id, id))
      .execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Persona no encontrada');
    }

    return { message: 'Persona actualizada correctamente' };
  }

  async subirFotoPerfil(
    id: number,
    file: Express.Multer.File,
    usuario: UsuarioJwt,
  ) {
  exigir(esMismaPersonaOAdmin(id, usuario));

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
  async eliminarPersona(id: number, usuario: UsuarioJwt) {
    exigir(esMismaPersonaOAdmin(id, usuario));

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
