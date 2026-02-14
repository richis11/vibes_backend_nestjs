import {
  mysqlTable,
  bigint,
  varchar,
  timestamp,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';

import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { users } from './schema_users';

export const personas = mysqlTable('personas', {
  id: bigint('id', { mode: 'number', unsigned: true })
    .primaryKey()
    .autoincrement(),

  user_id: bigint('user_id', { mode: 'number', unsigned: true })
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  cedula: varchar('cedula', { length: 30 }),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  telefono: varchar('telefono', { length: 30 }),
  direccion: varchar('direccion', { length: 255 }),
  foto_url: varchar('foto_url', { length: 500 }),
  estado: mysqlEnum('estado', ['activo', 'eliminado'])
    .notNull()
    .default('activo'),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
  deleted_at: timestamp('deleted_at'),
});

export type Persona = InferSelectModel<typeof personas>;
export type NuevaPersona = InferInsertModel<typeof personas>;
export type UpdatePersona = Partial<NuevaPersona>;
