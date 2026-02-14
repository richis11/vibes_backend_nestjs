import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../db/connection';
import { casas, NuevaCasa } from '../db/schema_casas';
import { eq , sql} from 'drizzle-orm';
import { UpdateCasa } from '../db/schema_casas';


export interface Casa {
  id: number;
  host_id: number;
  nombre: string;
  descripcion: string;
  direccion: string;
  precio: string;           // 🔹 cambiar de number a string
  disponibilidad: string;
  estado: string;
  created_at?: Date;        // si Drizzle usa Date
  updated_at?: Date;
  deleted_at?: Date;
}



@Injectable()
// LISTAR CASAS
export class CasasService {
  async obtenerCasas() {
    return await db.select().from(casas);
  }

  //LISTAR POR ID
  async obtenerCasaPorId(id: number) {
    const casa = await db.select().from(casas).where(eq(casas.id, id)).limit(1);

    if (!casa.length) {
      throw new NotFoundException('Casa no encontrada');
    }

    return casa[0];
  }


// BUSCAR CASAS
async buscarCasas(q: string, page = 1) {
    const limit = 10;
    const offset = (page - 1) * limit;
  
    return await db
      .select()
      .from(casas)
      .where(sql`
        MATCH(${casas.nombre}, ${casas.descripcion}, ${casas.direccion})
        AGAINST (${q} IN NATURAL LANGUAGE MODE)
      `)
      .limit(limit)
      .offset(offset);
  }
  

  // CREAR CASA
  async crearCasa(data: NuevaCasa) {
    await db.insert(casas).values(data);
    return { message: 'Casa creada correctamente' };
  }

  //EDITAR CASA
  async actualizarCasa(id: number, data: UpdateCasa) {
    const result = await db
      .update(casas)
      .set(data)
      .where(eq(casas.id, id))
      .execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Casa no encontrada');
    }

    return { message: 'Casa actualizada correctamente' };
  }

  //ELIMINAR CASA
  async eliminarCasa(id: number) {
    const result = await db.delete(casas).where(eq(casas.id, id)).execute();

    if (result[0].affectedRows === 0) {
      throw new NotFoundException('Casa no encontrada');
    }

    return { message: 'Casa eliminada correctamente' };
  }
}
