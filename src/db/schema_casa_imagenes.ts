import {
  mysqlTable,
  bigint,
  varchar,
  int,
  boolean,
  timestamp,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { casas } from './schema_casas';

export const casaImagenes = mysqlTable('casa_imagenes', {
  id: bigint('id', { mode: 'number', unsigned: true })
    .primaryKey()
    .autoincrement(),

  casa_id: bigint('casa_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => casas.id),

  url: varchar('url', { length: 500 }).notNull(),
  public_id: varchar('public_id', { length: 300 }), // ID en Cloudinary para poder eliminarlo
  orden: int('orden').default(0),
  es_principal: boolean('es_principal').default(false),

  estado: mysqlEnum('estado', ['activa', 'eliminada'])
    .notNull()
    .default('activa'),

  created_at: timestamp('created_at').defaultNow(),
  deleted_at: timestamp('deleted_at'),
});

export type CasaImagen = InferSelectModel<typeof casaImagenes>;
export type NuevaCasaImagen = InferInsertModel<typeof casaImagenes>;
export type UpdateCasaImagen = Partial<NuevaCasaImagen>;