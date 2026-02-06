// import { mysqlTable, serial, varchar, text, decimal } from "drizzle-orm/mysql-core";

// export const casas = mysqlTable("casas", {
//   id: serial("id").primaryKey(),
//   nombre: varchar("nombre", { length: 100 }).notNull(),
//   descripcion: text("descripcion"),
//   direccion: varchar("direccion", { length: 255 }).notNull(),
//   precio: decimal("precio", { precision: 10, scale: 2 }).notNull(),
//   estado: varchar("estado", { length: 50 }).notNull(),
// });

import { mysqlTable, varchar, int } from "drizzle-orm/mysql-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";


export const casas = mysqlTable("casas", {
  id: int("id").primaryKey().autoincrement(),
  nombre: varchar("nombre", { length: 255 }),
  descripcion: varchar("descripcion", { length: 255 }),
  direccion: varchar("direccion", { length: 255 }),
  precio: int("precio"),
  estado: varchar("estado", { length: 20 }),
});

export type Casa = InferSelectModel<typeof casas>;
export type NuevaCasa = InferInsertModel<typeof casas>;
export type UpdateCasa = Partial<NuevaCasa>;


