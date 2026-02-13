import {
  mysqlTable,
  bigint,
  varchar,
  decimal,
  timestamp,
  text,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core';

import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { hosts } from './schema_hosts';

export const casas = mysqlTable(
  'casas',
  {
    id: bigint('id', { mode: 'number', unsigned: true })
      .primaryKey()
      .autoincrement(),

    host_id: bigint('host_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => hosts.id), // ❌ sin cascade

    nombre: varchar('nombre', { length: 255 }).notNull(),
    descripcion: text('descripcion'), // ahora TEXT
    direccion: varchar('direccion', { length: 255 }).notNull(),
    precio: decimal('precio', { precision: 10, scale: 2 }).notNull(),

    disponibilidad: varchar('disponibilidad', { length: 30 }).default(
      'disponible',
    ),
    estado: mysqlEnum('estado', [
      'activa',
      'inactiva',
      'suspendida',
      'eliminada',
    ])
      .notNull()
      .default('activa'),

    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
    deleted_at: timestamp('deleted_at'),
  },
  (table) => {
    return {
      hostIdx: index('idx_casas_host_id').on(table.host_id),
      estadoIdx: index('idx_casas_estado').on(table.estado),
    };
  },
);

export type Casa = InferSelectModel<typeof casas>;
export type NuevaCasa = InferInsertModel<typeof casas>;
export type UpdateCasa = Partial<NuevaCasa>;
