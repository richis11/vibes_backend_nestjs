import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { db } from '../db/connection';
import { reservas, NuevaReserva, UpdateReserva } from '../db/schema_reservas';
import { eq, or, like, desc, asc, and, notInArray, sql, ne } from 'drizzle-orm';
import { casas } from '../db/schema_casas';


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
      throw new NotFoundException(
        'No se encontraron reservas para este usuario',
      );
    }

    return resultado;
  }

  // Buscar reservas por host_id (a través de casas)
  async obtenerReservasPorHost(hostId: number) {
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
      .where(eq(casas.host_id, hostId))
      .orderBy(reservas.id);

    if (!resultado.length) {
      throw new NotFoundException(
        'No se encontraron reservas para este anfitrión',
      );
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
  const hayConflicto = await this.verificarSolapamiento(
    data.casa_id,
    data.fecha_inicio,
    data.fecha_fin,
  );

  if (hayConflicto) {
    throw new ConflictException(
      'Las fechas seleccionadas ya están ocupadas para esta casa',
    );
  }

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
    const result = await db
      .delete(reservas)
      .where(eq(reservas.id, id))
      .execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return { message: 'Reserva eliminada correctamente' };
  }

  // ─── Obtener fechas ocupadas de una casa ──────────────────────────────────
  async obtenerFechasOcupadas(casaId: number) {
    const reservasActivas = await db
      .select({
        fecha_inicio: reservas.fecha_inicio,
        fecha_fin: reservas.fecha_fin,
      })
      .from(reservas)
      .where(
        and(
          eq(reservas.casa_id, casaId),
          notInArray(reservas.estado, ['cancelada', 'reembolsada']),
        ),
      );

    return reservasActivas;
  }

  // ─── Verificar solapamiento de fechas ────────────────────────────────────
  private async verificarSolapamiento(
    casaId: number,
    fechaInicio: string,
    fechaFin: string,
    excludeReservaId?: number,
  ): Promise<boolean> {
    const condiciones = [
      eq(reservas.casa_id, casaId),
      notInArray(reservas.estado, ['cancelada', 'reembolsada']),
      // Solapamiento: nueva_inicio < existente_fin AND nueva_fin > existente_inicio
      sql`${reservas.fecha_inicio} < ${fechaFin}`,
      sql`${reservas.fecha_fin} > ${fechaInicio}`,
    ];

    if (excludeReservaId) {
      condiciones.push(ne(reservas.id, excludeReservaId));
    }

    const conflictos = await db
      .select({ id: reservas.id })
      .from(reservas)
      .where(and(...condiciones))
      .limit(1);

    return conflictos.length > 0;
  }
}
