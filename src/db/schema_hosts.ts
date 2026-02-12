import {
  mysqlTable,
  bigint,
  varchar,
  boolean,
  decimal,
  timestamp,
} from 'drizzle-orm/mysql-core';

import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { personas } from './schema_personas'; // ajusta la ruta

export const hosts = mysqlTable('hosts', {
  id: bigint('id', { mode: 'number', unsigned: true })
    .primaryKey()
    .autoincrement(),

  persona_id: bigint('persona_id', { mode: 'number', unsigned: true })
    .notNull()
    .unique()
    .references(() => personas.id, { onDelete: 'cascade' }),

  stripe_account_id: varchar('stripe_account_id', { length: 255 }).unique(),
  stripe_onboarding_completed: boolean('stripe_onboarding_completed')
    .notNull()
    .default(false),

  verificado: boolean('verificado').notNull().default(false),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type Host = InferSelectModel<typeof hosts>;
export type NuevoHost = InferInsertModel<typeof hosts>;
export type UpdateHost = Partial<NuevoHost>;
