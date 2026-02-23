import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/connection';
import { casaImagenes } from '../db/schema_casa_imagenes';
import { eq, and } from 'drizzle-orm';
import cloudinary from '../config/cloudinary.config';
import { Readable } from 'stream';

@Injectable()
export class CasaImagenesService {

  // Subir imagen a Cloudinary y guardar en DB
  async subirImagen(
    casaId: number,
    file: Express.Multer.File,
    esPrincipal = false,
  ) {
    // Subir a Cloudinary usando stream (sin guardar en disco)
    const url = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `vibes/casas/${casaId}`,
            resource_type: 'image',
          },
          (error, result) => {
            if (error || !result) return reject(error);
            resolve({ secure_url: result.secure_url, public_id: result.public_id });
          },
        );
        Readable.from(file.buffer).pipe(uploadStream);
      },
    );

    // Si es principal, quitar principal anterior
    if (esPrincipal) {
      await db
        .update(casaImagenes)
        .set({ es_principal: false })
        .where(eq(casaImagenes.casa_id, casaId));
    }

    // Obtener el orden siguiente
    const existentes = await db
      .select()
      .from(casaImagenes)
      .where(eq(casaImagenes.casa_id, casaId));
    const orden = existentes.length;

    // Insertar en DB
    await db.insert(casaImagenes).values({
      casa_id: casaId,
      url: url.secure_url,
      public_id: url.public_id,
      orden,
      es_principal: esPrincipal || existentes.length === 0, // primera imagen es principal por defecto
    });

    return { message: 'Imagen subida correctamente', url: url.secure_url };
  }

  // Obtener todas las imágenes activas de una casa
  async obtenerImagenesPorCasa(casaId: number) {
    return await db
      .select()
      .from(casaImagenes)
      .where(
        and(
          eq(casaImagenes.casa_id, casaId),
          eq(casaImagenes.estado, 'activa'),
        ),
      );
  }

  // Marcar como principal
  async marcarPrincipal(casaId: number, imagenId: number) {
    // Quitar principal actual
    await db
      .update(casaImagenes)
      .set({ es_principal: false })
      .where(eq(casaImagenes.casa_id, casaId));

    // Marcar la nueva
    const result = await db
      .update(casaImagenes)
      .set({ es_principal: true })
      .where(eq(casaImagenes.id, imagenId));

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Imagen no encontrada');
    }

    return { message: 'Imagen principal actualizada' };
  }

  // Eliminar imagen (soft delete + borrar de Cloudinary)
  async eliminarImagen(imagenId: number) {
    const imagen = await db
      .select()
      .from(casaImagenes)
      .where(eq(casaImagenes.id, imagenId))
      .limit(1);

    if (!imagen.length) {
      throw new NotFoundException('Imagen no encontrada');
    }

    // Eliminar de Cloudinary si tiene public_id
    if (imagen[0].public_id) {
      await cloudinary.uploader.destroy(imagen[0].public_id);
    }

    // Soft delete en DB
    await db
      .update(casaImagenes)
      .set({ estado: 'eliminada', deleted_at: new Date() })
      .where(eq(casaImagenes.id, imagenId));

    return { message: 'Imagen eliminada correctamente' };
  }
}