import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Readable } from 'stream';
import { db } from '../db/connection';
import { pagos } from '../db/schema_pagos';
import { reservas } from '../db/schema_reservas';
import { casas } from '../db/schema_casas';
import cloudinary from '../config/cloudinary.config';
import { exigir } from '../auth/permisos';
import { UsuarioJwt } from '../auth/usuario.decorator';
import { SubirComprobanteDto } from './pagos.dto';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Campos que ve el huésped (sin datos de quién revisó)
const columnasPago = {
  id: pagos.id,
  reserva_id: pagos.reserva_id,
  metodo: pagos.metodo,
  estado: pagos.estado,
  monto: pagos.monto,
  moneda: pagos.moneda,
  referencia: pagos.referencia,
  comprobante_url: pagos.comprobante_url,
  motivo_rechazo: pagos.motivo_rechazo,
  created_at: pagos.created_at,
};

async function reservaDelHuesped(reservaId: number, usuario: UsuarioJwt) {
  const reserva = await db
    .select({
      id: reservas.id,
      guest_id: reservas.guest_id,
      estado: reservas.estado,
      total: reservas.total,
      moneda: reservas.moneda,
    })
    .from(reservas)
    .where(eq(reservas.id, reservaId))
    .limit(1);

  if (!reserva.length) throw new NotFoundException('Reserva no encontrada');
  exigir(
    usuario.is_admin || reserva[0].guest_id === usuario.persona_id,
    'Esta reserva no es tuya',
  );
  return reserva[0];
}

// Solo se paga una reserva pendiente que no tenga ya un comprobante en revisión
async function exigirPagable(
  reservaId: number,
  estado: string,
  ejecutor: Tx | typeof db = db,
) {
  if (estado !== 'pendiente_pago') {
    throw new ConflictException('Esta reserva no está pendiente de pago');
  }
  const enRevision = await ejecutor
    .select({ id: pagos.id })
    .from(pagos)
    .where(and(eq(pagos.reserva_id, reservaId), eq(pagos.estado, 'en_revision')))
    .limit(1);
  if (enRevision.length) {
    throw new ConflictException('Ya hay un comprobante en revisión para esta reserva');
  }
}

// Sube el comprobante como "authenticated": solo se abre con la URL firmada,
// que el backend entrega únicamente al huésped y al admin.
function subirACloudinary(reservaId: number, file: Express.Multer.File) {
  return new Promise<{ url: string; public_id: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `vibes/comprobantes/${reservaId}`,
        resource_type: 'image',
        type: 'authenticated',
      },
      (error, result) => {
        if (error || !result) return reject(error);
        const url = cloudinary.url(result.public_id, {
          type: 'authenticated',
          resource_type: 'image',
          sign_url: true,
          secure: true,
          version: result.version,
          format: result.format,
        });
        resolve({ url, public_id: result.public_id });
      },
    );
    Readable.from(file.buffer).pipe(uploadStream);
  });
}

@Injectable()
export class PagosService {
  // POST /pagos/reserva/:reservaId/comprobante
  async subirComprobante(
    reservaId: number,
    file: Express.Multer.File,
    data: SubirComprobanteDto,
    usuario: UsuarioJwt,
  ) {
    if (!file) {
      throw new BadRequestException('Falta el archivo "comprobante"');
    }
    const reserva = await reservaDelHuesped(reservaId, usuario);
    await exigirPagable(reservaId, reserva.estado); // antes de subir nada

    const subido = await subirACloudinary(reservaId, file);

    try {
      await db.transaction(async (tx) => {
        // Se vuelve a comprobar con la reserva bloqueada por si hubo dos envíos a la vez
        const actual = await tx
          .select({ estado: reservas.estado })
          .from(reservas)
          .where(eq(reservas.id, reservaId))
          .limit(1)
          .for('update');
        await exigirPagable(reservaId, actual[0]?.estado, tx);

        await tx.insert(pagos).values({
          reserva_id: reservaId,
          metodo: 'transferencia',
          monto: reserva.total,
          moneda: reserva.moneda,
          referencia: data.referencia?.trim() || null,
          comprobante_url: subido.url,
          comprobante_public_id: subido.public_id,
        });
      });
    } catch (err) {
      await cloudinary.uploader
        .destroy(subido.public_id, { type: 'authenticated' })
        .catch(() => undefined);
      throw err;
    }

    return { message: 'Comprobante enviado. Lo revisaremos pronto.' };
  }

  // GET /pagos/reserva/:reservaId — historial de pagos de una reserva
  async pagosDeReserva(reservaId: number, usuario: UsuarioJwt) {
    await reservaDelHuesped(reservaId, usuario);
    return db
      .select(columnasPago)
      .from(pagos)
      .where(eq(pagos.reserva_id, reservaId))
      .orderBy(desc(pagos.id));
  }

  // GET /pagos/mios — todos los pagos del huésped (para "Mis reservas")
  async misPagos(usuario: UsuarioJwt) {
    if (!usuario.persona_id) return [];
    return db
      .select(columnasPago)
      .from(pagos)
      .innerJoin(reservas, eq(pagos.reserva_id, reservas.id))
      .where(eq(reservas.guest_id, usuario.persona_id))
      .orderBy(desc(pagos.id));
  }

  // GET /pagos?estado=en_revision (admin)
  async listar(estado?: 'en_revision' | 'aprobado' | 'rechazado') {
    return db
      .select({
        ...columnasPago,
        revisado_at: pagos.revisado_at,
        reserva_estado: reservas.estado,
        fecha_inicio: reservas.fecha_inicio,
        fecha_fin: reservas.fecha_fin,
        guest_id: reservas.guest_id,
        casa_id: reservas.casa_id,
        casa_nombre: casas.nombre,
      })
      .from(pagos)
      .innerJoin(reservas, eq(pagos.reserva_id, reservas.id))
      .innerJoin(casas, eq(reservas.casa_id, casas.id))
      .where(estado ? eq(pagos.estado, estado) : undefined)
      .orderBy(desc(pagos.id));
  }

  // PUT /pagos/:id/aprobar (admin): el pago queda aprobado y la reserva pagada
  async aprobar(id: number, usuario: UsuarioJwt) {
    await db.transaction(async (tx) => {
      const pago = await this.pagoEnRevision(tx, id);

      const reserva = await tx
        .select({ estado: reservas.estado })
        .from(reservas)
        .where(eq(reservas.id, pago.reserva_id))
        .limit(1)
        .for('update');
      if (reserva[0]?.estado !== 'pendiente_pago') {
        throw new ConflictException(
          `La reserva ya no está pendiente de pago (está "${reserva[0]?.estado}"). Rechaza el comprobante.`,
        );
      }

      await tx
        .update(pagos)
        .set({ estado: 'aprobado', revisado_por: usuario.sub, revisado_at: sql`NOW()` })
        .where(eq(pagos.id, id));
      await tx
        .update(reservas)
        .set({ estado: 'pagada' })
        .where(eq(reservas.id, pago.reserva_id));
    });

    return { message: 'Pago aprobado; la reserva quedó pagada' };
  }

  // PUT /pagos/:id/rechazar (admin): la reserva sigue pendiente y el huésped puede reenviar
  async rechazar(id: number, motivo: string, usuario: UsuarioJwt) {
    await db.transaction(async (tx) => {
      await this.pagoEnRevision(tx, id);
      await tx
        .update(pagos)
        .set({
          estado: 'rechazado',
          motivo_rechazo: motivo.trim(),
          revisado_por: usuario.sub,
          revisado_at: sql`NOW()`,
        })
        .where(eq(pagos.id, id));
    });

    return { message: 'Comprobante rechazado' };
  }

  private async pagoEnRevision(tx: Tx, id: number) {
    const pago = await tx
      .select({ reserva_id: pagos.reserva_id, estado: pagos.estado })
      .from(pagos)
      .where(eq(pagos.id, id))
      .limit(1)
      .for('update');

    if (!pago.length) throw new NotFoundException('Pago no encontrado');
    if (pago[0].estado !== 'en_revision') {
      throw new ConflictException('Este pago ya fue revisado');
    }
    return pago[0];
  }
}
