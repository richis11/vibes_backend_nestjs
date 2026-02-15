import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Query,
} from '@nestjs/common';

import { PersonasService } from './personas.service';
import type { NuevaPersona, UpdatePersona } from '../db/schema_personas';

@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  // 🔎 GET /personas/buscar?q=algo&page=1
  @Get('buscar')
  buscar(@Query('q') q: string, @Query('page') page = '1') {
    return this.personasService.buscarPersonas(q, Number(page));
  }

  // 📄 GET /personas
  @Get()
  obtenerPersonas() {
    return this.personasService.obtenerPersonas();
  }
  // GET /users disponibles
  @Get('personasDisponibles')
  obtenerPersonasDisponibles() {
    return this.personasService.obtenerPersonasDisponibles();
  }


  // 🔢 GET /personas/:id
  @Get(':id')
  async obtenerPersonaPorId(@Param('id') id: string) {
    return await this.personasService.obtenerPersonaPorId(Number(id));
  }

  // ➕ POST /personas
  @Post()
  async crearPersona(@Body() body: NuevaPersona) {
    return this.personasService.crearPersona(body);
  }

  // ✏ PUT /personas/:id
  @Put(':id')
  actualizarPersona(@Param('id') id: string, @Body() data: UpdatePersona) {
    return this.personasService.actualizarPersona(Number(id), data);
  }

  // 🗑 DELETE /personas/:id (soft delete)
  @Delete(':id')
  eliminarPersona(@Param('id') id: string) {
    return this.personasService.eliminarPersona(Number(id));
  }
}
