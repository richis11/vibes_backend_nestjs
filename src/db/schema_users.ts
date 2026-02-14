import {
  mysqlTable,
  bigint,
  varchar,
  boolean,
  timestamp,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core';

import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const users = mysqlTable(
  'users',
  {
    id: bigint('id', { mode: 'number', unsigned: true })
      .primaryKey()
      .autoincrement(),

    email: varchar('email', { length: 255 }).notNull().unique(),
    password_hash: varchar('password_hash', { length: 255 }).notNull(),
    is_admin: boolean('is_admin').notNull().default(false),

    stripe_customer_id: varchar('stripe_customer_id', { length: 255 }).unique(),
    
    estado: mysqlEnum('estado', ['activo', 'suspendido', 'eliminado'])
      .notNull()
      .default('activo'),

    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
    deleted_at: timestamp('deleted_at'),
  },
  (table) => {
    return {
      estadoIdx: index('idx_users_estado').on(table.estado),
      deletedIdx: index('idx_users_deleted_at').on(table.deleted_at),
    };
  },
);

export type User = InferSelectModel<typeof users>;
export type NuevoUser = InferInsertModel<typeof users>;
export type UpdateUser = Partial<NuevoUser>;
