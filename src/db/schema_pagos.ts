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
import { reservas } from './schema_reservas';

// Cada intento de pago de una reserva. Una reserva puede tener varios
// (p. ej. un comprobante rechazado y luego otro aprobado).
export const pagos = mysqlTable(
  'pagos',
  {
    id: bigint('id', { mode: 'number', unsigned: true })
      .primaryKey()
      .autoincrement(),

    reserva_id: bigint('reserva_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => reservas.id, { onDelete: 'cascade' }),

    metodo: mysqlEnum('metodo', ['transferencia', 'payphone']).notNull(),

    estado: mysqlEnum('estado', ['en_revision', 'aprobado', 'rechazado'])
      .notNull()
      .default('en_revision'),

    monto: decimal('monto', { precision: 10, scale: 2 }).notNull(),
    moneda: varchar('moneda', { length: 10 }).notNull().default('USD'),

    // Nº de comprobante del banco (o id de transacción de PayPhone)
    referencia: varchar('referencia', { length: 255 }),

    comprobante_url: varchar('comprobante_url', { length: 500 }),
    comprobante_public_id: varchar('comprobante_public_id', { length: 255 }),

    motivo_rechazo: varchar('motivo_rechazo', { length: 255 }),
    revisado_por: bigint('revisado_por', { mode: 'number', unsigned: true }), // users.id
    revisado_at: timestamp('revisado_at'),

    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    reservaIdx: index('idx_pagos_reserva_id').on(table.reserva_id),
    estadoIdx: index('idx_pagos_estado').on(table.estado),
  }),
);

export type Pago = InferSelectModel<typeof pagos>;
export type NuevoPago = InferInsertModel<typeof pagos>;
