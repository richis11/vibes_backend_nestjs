import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/connection';
import { reservas, NuevaReserva, UpdateReserva } from '../db/schema_reservas';
import { eq, or, like } from 'drizzle-orm';
import { casas } from '../db/schema_casas';

// export interface Reserva {
//   id: number;
//   casa_id: number;
//   guest_id: number;
//   fecha_inicio: string;
//   fecha_fin: string;
//   noches: number;
//   precio_por_noche: string;
//   subtotal: string;
//   comision_plataforma: string;
//   total: string;
//   moneda: string;
//   estado:
//     | 'pendiente_pago'
//     | 'pagada'
//     | 'confirmada'
//     | 'cancelada'
//     | 'completada'
//     | 'reembolsada';
//   stripe_payment_intent_id?: string;
//   stripe_transfer_id?: string;
//   cancelada_por?: 'guest' | 'host' | 'system';
//   motivo_cancelacion?: string;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date;
// }

@Injectable()
export class ReservasService {
  // LISTAR TODAS LAS RESERVAS
  async obtenerReservas() {
    return await db.select().from(reservas);
  }

  // LISTAR POR ID
  async obtenerReservaPorId(id: number) {
    const reserva = await db
      .select()
      .from(reservas)
      .where(eq(reservas.id, id))
      .limit(1);
    if (!reserva.length) {
      throw new NotFoundException('Reserva no encontrada');
    }
    return reserva[0];
  }
  // Buscar reservas por guest_id (persona)
async obtenerReservasPorGuest(guestId: number) {
  const resultado = await db
    .select({
      id: reservas.id,
      casa_id: reservas.casa_id,
      casa_nombre: casas.nombre,
      guest_id: reservas.guest_id,
      fecha_inicio: reservas.fecha_inicio,
      fecha_fin: reservas.fecha_fin,
      noches: reservas.noches,
      precio_por_noche: reservas.precio_por_noche,
      subtotal: reservas.subtotal,
      comision_plataforma: reservas.comision_plataforma,
      total: reservas.total,
      moneda: reservas.moneda,
      estado: reservas.estado,
      created_at: reservas.created_at,
    })
    .from(reservas)
    .innerJoin(casas, eq(reservas.casa_id, casas.id))
    .where(eq(reservas.guest_id, guestId));

  if (!resultado.length) {
    throw new NotFoundException('No se encontraron reservas para este usuario');
  }

  return resultado;
}

  // BUSCAR RESERVAS (por guest_id, estado o casa_id opcional)
  async buscarReservas(q: string, page = 1) {
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!q) return this.obtenerReservas();

    return await db
      .select()
      .from(reservas)
      .where(
        or(
          like(reservas.estado, `%${q}%`),
          like(reservas.cancelada_por, `%${q}%`),
        ),
      )
      .limit(limit)
      .offset(offset);
  }

  // CREAR RESERVA
  async crearReserva(data: NuevaReserva) {
    await db.insert(reservas).values(data);
    return { message: 'Reserva creada correctamente' };
  }

  // ACTUALIZAR RESERVA
  async actualizarReserva(id: number, data: UpdateReserva) {
    const result = await db
      .update(reservas)
      .set(data)
      .where(eq(reservas.id, id))
      .execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return { message: 'Reserva actualizada correctamente' };
  }

  // SOFT DELETE
//   async eliminarReserva(id: number) {
//     const result = await db
//       .update(reservas)
//       .set({ estado: 'cancelada', deleted_at: new Date() })
//       .where(eq(reservas.id, id))
//       .execute();

//     if (result[0].affectedRows === 0) {
//       throw new NotFoundException('Reserva no encontrada');
//     }

//     return { message: 'Reserva cancelada correctamente' };
//   }

  // ELIMINAR USER (delete físico por ahora)
  async eliminarReserva(id: number) {
    const result = await db.delete(reservas).where(eq(reservas.id, id)).execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return { message: 'Reserva eliminada correctamente' };
  }
}
