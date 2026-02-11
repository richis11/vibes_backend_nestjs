import { int, mysqlTable, varchar, decimal, timestamp, boolean } from "drizzle-orm/mysql-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";


// export const casas = mysqlTable("casas", {
//   id: int("id").primaryKey().autoincrement(),
//   nombre: varchar("nombre", { length: 255 }),
//   descripcion: varchar("descripcion", { length: 255 }),
//   direccion: varchar("direccion", { length: 255 }),
//   precio: int("precio"),
//   estado: varchar("estado", { length: 20 }),
// });


export const casas = mysqlTable("casas", {
  id: int("id").primaryKey().autoincrement(),
  host_id: int("host_id"), // nuevo campo
  nombre: varchar("nombre", { length: 255 }),
  descripcion: varchar("descripcion", { length: 255 }),
  direccion: varchar("direccion", { length: 255 }),
  precio: decimal("precio", { precision: 10, scale: 2 }), // mejor usar decimal para dinero
  estado: varchar("estado", { length: 20 }),
  created_at: timestamp("created_at").defaultNow(), // nuevo campo
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(), // nuevo campo
});


export type Casa = InferSelectModel<typeof casas>;
export type NuevaCasa = InferInsertModel<typeof casas>;
export type UpdateCasa = Partial<NuevaCasa>;


