import {
  mysqlTable,
  bigint,
  decimal,
  varchar,
  timestamp,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { casas } from './schema_casas';
import { personas } from './schema_personas';

export const reservas = mysqlTable(
  'reservas',
  {
    id: bigint('id', { mode: 'number', unsigned: true })
      .primaryKey()
      .autoincrement(),

    casa_id: bigint('casa_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => casas.id, { onDelete: 'cascade' }),

    guest_id: bigint('guest_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => personas.id, { onDelete: 'cascade' }),

    fecha_inicio: varchar('fecha_inicio', { length: 10 }).notNull(), // YYYY-MM-DD
    fecha_fin: varchar('fecha_fin', { length: 10 }).notNull(), // YYYY-MM-DD

    noches: bigint('noches', { mode: 'number', unsigned: true }).notNull(),
    precio_por_noche: decimal('precio_por_noche', {
      precision: 10,
      scale: 2,
    }).notNull(),
    
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    comision_plataforma: decimal('comision_plataforma', {
      precision: 10,
      scale: 2,
    }).notNull(),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),

    moneda: varchar('moneda', { length: 10 }).notNull().default('MXN'),

    estado: mysqlEnum('estado', [
      'pendiente_pago',
      'pagada',
      'confirmada',
      'cancelada',
      'completada',
      'reembolsada',
    ])
      .notNull()
      .default('pendiente_pago'),

    stripe_payment_intent_id: varchar('stripe_payment_intent_id', {
      length: 255,
    }).unique(),
    stripe_transfer_id: varchar('stripe_transfer_id', { length: 255 }),

    cancelada_por: mysqlEnum('cancelada_por', ['guest', 'host', 'system']),
    motivo_cancelacion: varchar('motivo_cancelacion', { length: 255 }),

    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
    deleted_at: timestamp('deleted_at'),
  },
  (table) => ({
    casaIdx: index('idx_reservas_casa_id').on(table.casa_id),
    guestIdx: index('idx_reservas_guest_id').on(table.guest_id),
    estadoIdx: index('idx_reservas_estado').on(table.estado),
  }),
);

export type Reserva = InferSelectModel<typeof reservas>;
export type NuevaReserva = InferInsertModel<typeof reservas>;
export type UpdateReserva = Partial<NuevaReserva>;
