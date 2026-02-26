// src/casas/casas.controller.ts
import { Controller, Get, Post, Body, Put, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { CasasService } from './casas.service';
import type { UpdateCasa, NuevaCasa } from '../db/schema_casas';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('casas')
@UseGuards(JwtAuthGuard) // 👈 Proteger todas las rutas por defecto
export class CasasController {
  constructor(private readonly casasService: CasasService) {}

   
   // GET /casas/(busqueda)
  @Public()
   @Get('buscar')
   buscar(
     @Query('q') q: string,
     @Query('page') page = '1',
   ) {
       return this.casasService.buscarCasas(q, Number(page));
     }
  
  // GET /casas - todas las casas
  @Public()
  @Get()
  obtenerCasas() {
    return this.casasService.obtenerCasas();
  }

  // GET /casas/host/:hostId
@Get('host/:hostId')
async obtenerCasasPorHost(@Param('hostId') hostId: string) {
  return await this.casasService.obtenerCasasPorHost(Number(hostId));
}

  // GET /casas/(id)
  @Public()
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
