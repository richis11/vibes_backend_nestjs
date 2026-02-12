import { mysqlTable, bigint, varchar, timestamp } from 'drizzle-orm/mysql-core';

import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { users } from './schema_users'; // asegúrate de ajustar la ruta

export const personas = mysqlTable('personas', {
  id: bigint('id', { mode: 'number', unsigned: true })
    .primaryKey()
    .autoincrement(),

  user_id: bigint('user_id', { mode: 'number', unsigned: true })
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  nombre: varchar('nombre', { length: 150 }).notNull(),
  telefono: varchar('telefono', { length: 30 }),
  foto_url: varchar('foto_url', { length: 500 }),
  direccion: varchar('direccion', { length: 255 }),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type Persona = InferSelectModel<typeof personas>;
export type NuevaPersona = InferInsertModel<typeof personas>;
export type UpdatePersona = Partial<NuevaPersona>;
