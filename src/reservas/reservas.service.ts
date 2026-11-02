import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../db/connection';
import { reservas } from '../db/schema_reservas';
import {
  eq,
  or,
  like,
  desc,
  asc,
  and,
  inArray,
  lt,
  gt,
  ne,
} from 'drizzle-orm';
import { calcularNoches, calcularPrecioReserva } from './precio';
import { casas } from '../db/schema_casas';
import {
  exigir,
  exigirCampos,
  hostDeCasa,
  hostIdDe,
  sinCamposDeAdmin,
} from '../auth/permisos';
import { UsuarioJwt } from '../auth/usuario.decorator';
import { CrearReservaDto, UpdateReservaDto } from './reservas.dto';

// Campos que solo la plataforma (admin / Stripe) puede tocar
const CAMPOS_ADMIN: (keyof UpdateReservaDto)[] = [
  'casa_id',
  'guest_id',
  'stripe_payment_intent_id',
  'stripe_transfer_id',
];

type Rol = 'admin' | 'guest' | 'host';

// Estados a los que cada rol puede mover una reserva (pagos los marca Stripe/admin)
const ESTADOS_POR_ROL: Record<Rol, string[] | null> = {
  admin: null, // sin restricción
  guest: ['cancelada'],
  host: ['confirmada', 'cancelada', 'completada'],
};

// El huésped, el anfitrión de la casa o un admin
async function exigirParticipante(
  reserva: { guest_id: number; casa_id: number },
  usuario: UsuarioJwt,
): Promise<Rol> {
  if (usuario.is_admin) return 'admin';
  if (reserva.guest_id === usuario.persona_id) return 'guest';
  const hostId = await hostDeCasa(reserva.casa_id);
  exigir(hostId === (await hostIdDe(usuario)), 'Esta reserva no es tuya');
  return 'host';
}

// Estados que ocupan las fechas de la casa
const ESTADOS_ACTIVOS = ['pendiente_pago', 'pagada', 'confirmada'] as const;
const esActiva = (estado: string) =>
  (ESTADOS_ACTIVOS as readonly string[]).includes(estado);

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Bloquea la casa (FOR UPDATE) para que dos reservas simultáneas no se
// pisen, verifica que las fechas estén libres y calcula el precio.
async function cotizarFechasLibres(
  tx: Tx,
  casaId: number,
  fecha_inicio: string,
  fecha_fin: string,
  excluirReservaId?: number,
) {
  const casa = await tx
    .select({ precio: casas.precio, estado: casas.estado })
    .from(casas)
    .where(eq(casas.id, casaId))
    .limit(1)
    .for('update');

  if (!casa.length) throw new NotFoundException('Casa no encontrada');
  if (casa[0].estado !== 'activa') {
    throw new BadRequestException('La casa no está disponible para reservar');
  }

  // Calcula primero: valida que las fechas existan y que fin > inicio
  const precio = calcularPrecioReserva(casa[0].precio, fecha_inicio, fecha_fin);

  const choque = await tx
    .select({ id: reservas.id })
    .from(reservas)
    .where(
      and(
        eq(reservas.casa_id, casaId),
        inArray(reservas.estado, [...ESTADOS_ACTIVOS]),
        lt(reservas.fecha_inicio, fecha_fin),
        gt(reservas.fecha_fin, fecha_inicio),
        excluirReservaId ? ne(reservas.id, excluirReservaId) : undefined,
      ),
    )
    .limit(1);

  if (choque.length) {
    throw new ConflictException('La casa ya está reservada en esas fechas');
  }

  return precio;
}

// Hoy en formato YYYY-MM-DD (con un día de margen por zonas horarias)
function ayer(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

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
  async obtenerReservaPorId(id: number, usuario: UsuarioJwt) {
    const reserva = await db
      .select()
      .from(reservas)
      .where(eq(reservas.id, id))
      .limit(1);
    if (!reserva.length) {
      throw new NotFoundException('Reserva no encontrada');
    }
    await exigirParticipante(reserva[0], usuario);
    return reserva[0];
  }
  // Buscar reservas por guest_id (persona)
async obtenerReservasPorGuest(guestId: number, usuario: UsuarioJwt) {
  exigir(usuario.is_admin || usuario.persona_id === guestId);

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

// Buscar reservas por host_id (a través de casas)
async obtenerReservasPorHost(hostId: number, usuario: UsuarioJwt) {
  exigir(usuario.is_admin || (await hostIdDe(usuario)) === hostId);

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
  .orderBy((reservas.id));

  if (!resultado.length) {
    throw new NotFoundException('No se encontraron reservas para este anfitrión');
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
  async crearReserva(data: CrearReservaDto, usuario: UsuarioJwt) {
    // El admin puede reservar a nombre de otro; si no indica guest_id, reserva para sí mismo
    const guest_id = usuario.is_admin
      ? (data.guest_id ?? usuario.persona_id)
      : usuario.persona_id;
    if (!guest_id) {
      throw new BadRequestException('guest_id es obligatorio');
    }

    calcularNoches(data.fecha_inicio, data.fecha_fin); // 400 antes de tocar la DB
    if (!usuario.is_admin && data.fecha_inicio < ayer()) {
      throw new BadRequestException('No se puede reservar en fechas pasadas');
    }

    // Una reserva nueva siempre empieza pendiente de pago
    const permitido = sinCamposDeAdmin(usuario, data, [
      ...CAMPOS_ADMIN,
      'estado',
      'cancelada_por',
      'motivo_cancelacion',
    ]);

    const precio = await db.transaction(async (tx) => {
      const precio = await cotizarFechasLibres(
        tx,
        data.casa_id,
        data.fecha_inicio,
        data.fecha_fin,
      );

      await tx
        .insert(reservas)
        .values({ ...permitido, ...precio, casa_id: data.casa_id, guest_id });

      return precio;
    });

    return { message: 'Reserva creada correctamente', ...precio };
  }

  // ACTUALIZAR RESERVA
  async actualizarReserva(
    id: number,
    data: UpdateReservaDto,
    usuario: UsuarioJwt,
  ) {
    const actual = await this.obtenerReservaPorId(id, usuario);
    const rol = await exigirParticipante(actual, usuario);

    const estadosPermitidos = ESTADOS_POR_ROL[rol];
    if (data.estado && estadosPermitidos) {
      exigir(
        estadosPermitidos.includes(data.estado),
        `No puedes cambiar la reserva a "${data.estado}"`,
      );
    }

    const permitido = sinCamposDeAdmin(usuario, data, CAMPOS_ADMIN);

    const fecha_inicio = permitido.fecha_inicio ?? actual.fecha_inicio;
    const fecha_fin = permitido.fecha_fin ?? actual.fecha_fin;
    const casa_id = permitido.casa_id ?? actual.casa_id;
    const estado = permitido.estado ?? actual.estado;

    const cambianFechas =
      fecha_inicio !== actual.fecha_inicio ||
      fecha_fin !== actual.fecha_fin ||
      casa_id !== actual.casa_id;

    // Una vez pagada, cambiar fechas cambiaría el monto cobrado
    if (cambianFechas && rol !== 'admin') {
      exigir(
        actual.estado === 'pendiente_pago',
        'Solo se pueden cambiar las fechas antes de pagar',
      );
    }

    // Reactivar una reserva cancelada también vuelve a ocupar fechas
    const ocupaFechasNuevas =
      esActiva(estado) && (cambianFechas || !esActiva(actual.estado));

    const result = await db.transaction(async (tx) => {
      const precio = ocupaFechasNuevas
        ? await cotizarFechasLibres(tx, casa_id, fecha_inicio, fecha_fin, id)
        : {};

      return tx
        .update(reservas)
        .set(exigirCampos({ ...permitido, ...(cambianFechas ? precio : {}) }))
        .where(eq(reservas.id, id))
        .execute();
    });

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
  async eliminarReserva(id: number, usuario: UsuarioJwt) {
    await this.obtenerReservaPorId(id, usuario);

    const result = await db.delete(reservas).where(eq(reservas.id, id)).execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return { message: 'Reserva eliminada correctamente' };
  }

  // ─── Obtener fechas ocupadas de una casa (público, para el calendario) ─────
  // Mismos estados que bloquean una reserva nueva (ver cotizarFechasLibres);
  // fecha_fin es el día de salida, así que ese día queda libre para entrar.
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
          inArray(reservas.estado, [...ESTADOS_ACTIVOS]),
          gt(reservas.fecha_fin, ayer()),
        ),
      );

    return reservasActivas;
  }
}
