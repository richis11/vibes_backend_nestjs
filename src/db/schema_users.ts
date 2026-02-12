import {
  mysqlTable,
  bigint,
  varchar,
  boolean,
  timestamp,
} from 'drizzle-orm/mysql-core';

import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: bigint('id', { mode: 'number', unsigned: true })
    .primaryKey()
    .autoincrement(),

  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  is_admin: boolean('is_admin').notNull().default(false),
  stripe_customer_id: varchar('stripe_customer_id', { length: 255 }).unique(),
  
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type User = InferSelectModel<typeof users>;
export type NuevoUser = InferInsertModel<typeof users>;
export type UpdateUser = Partial<NuevoUser>;
