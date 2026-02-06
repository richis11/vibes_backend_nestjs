import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/connection';
import { casas, NuevaCasa } from '../db/schema_casas';
import { eq } from 'drizzle-orm';
import { UpdateCasa } from '../db/schema_casas';

export interface Casa {
  id: number;
  nombre: string;
  descripcion: string;
  direccion: string;
  precio: number;
  estado: string;
}

@Injectable()
// LISTAR CASAS
export class CasasService {
  async obtenerCasas() {
    return await db.select().from(casas);
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
      throw new NotFoundException("Casa no encontrada");
    }
  
    return { message: "Casa actualizada correctamente" };
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

//   async crearCasa(data: {
//     nombre: string;
//     descripcion: string;
//     direccion: string;
//     precio: number;
//     estado: string;
//   })
//   {
//     await db.insert(casas).values(data);
//     return { message: 'Casa creada correctamente' };
//   }
//}
