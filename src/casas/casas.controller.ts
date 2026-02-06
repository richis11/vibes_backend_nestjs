import { Controller, Get, Post, Body, Put, Delete, Param} from '@nestjs/common';
import { CasasService, Casa } from './casas.service';
import type { UpdateCasa } from "../db/schema_casas";





@Controller('casas')
export class CasasController {
  constructor(private readonly casasService: CasasService) {}

  // GET /casas
  @Get()
  obtenerCasas() {
    return this.casasService.obtenerCasas();
  }

  //POST /casas
  @Post()
  crearCasa(@Body() body: Omit<Casa, 'id'>) {
    return this.casasService.crearCasa(body);
  }

  @Put(":id")
  actualizarCasa(
    @Param("id") id: string,
    @Body() data: UpdateCasa
  ) {
    return this.casasService.actualizarCasa(Number(id), data);
  }

  @Delete(":id")
  eliminarCasa(@Param("id") id: string) {
    return this.casasService.eliminarCasa(Number(id));
  }
}
