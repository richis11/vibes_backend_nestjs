import { Controller, Get, Post, Body, Put, Delete, Param, Query} from '@nestjs/common';
import { CasasService } from './casas.service';
import type { UpdateCasa } from "../db/schema_casas";
import type{ NuevaCasa } from '../db/schema_casas';


@Controller('casas')
export class CasasController {
  constructor(private readonly casasService: CasasService) {}

   // GET /casas/(busqueda)
   @Get('buscar')
   buscar(
     @Query('q') q: string,
     @Query('page') page = '1',
   ) {
       return this.casasService.buscarCasas(q, Number(page));
     }
  
  // GET /casas - todas las casas
  @Get()
  obtenerCasas() {
    return this.casasService.obtenerCasas();
  }

  // GET /casas/(id)
  @Get(":id")
  async obtenerCasaPorId(@Param("id") id: string) {
    return await this.casasService.obtenerCasaPorId(Number(id));
  }

 


  //POST /casas
  @Post()
async crearCasa(@Body() body: NuevaCasa) {
  return this.casasService.crearCasa(body);
}
  //PUT /casas/(numero)
  @Put(":id")
  actualizarCasa(
    @Param("id") id: string,
    @Body() data: UpdateCasa
  ) {
    return this.casasService.actualizarCasa(Number(id), data);
  }

  //DELETE /casas/(numero)
  @Delete(":id")
  eliminarCasa(@Param("id") id: string) {
    return this.casasService.eliminarCasa(Number(id));
  }
}
