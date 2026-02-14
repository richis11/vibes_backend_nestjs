import {
  mysqlTable,
  bigint,
  varchar,
  boolean,
  decimal,
  timestamp,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';

import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { personas } from './schema_personas';

export const hosts = mysqlTable('hosts', {
  id: bigint('id', { mode: 'number', unsigned: true })
    .primaryKey()
    .autoincrement(),

  persona_id: bigint('persona_id', { mode: 'number', unsigned: true })
    .notNull()
    .unique()
    .references(() => personas.id, { onDelete: 'cascade' }),

  verificado: boolean('verificado').default(false),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  estado: mysqlEnum('estado', ['activo', 'suspendido', 'eliminado'])
    .notNull()
    .default('activo'),

  stripe_account_id: varchar('stripe_account_id', { length: 255 }).unique(),
  stripe_onboarding_completed: boolean('stripe_onboarding_completed').default(
    false,
  ),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
  deleted_at: timestamp('deleted_at'),
});

export type Host = InferSelectModel<typeof hosts>;
export type NuevoHost = InferInsertModel<typeof hosts>;
export type UpdateHost = Partial<NuevoHost>;
