import { PersonasService } from './personas.service';
import type { NuevaPersona, UpdatePersona } from '../db/schema_personas';

import { Controller, Get, Post, Body, Put, Delete, Param, Query,
  UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

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

  // Nuevo endpoint — POST /personas/:id/foto
@Post(':id/foto')
@UseInterceptors(
  FileInterceptor('foto', {
    storage: memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\//)) return cb(new Error('Solo imágenes'), false);
      cb(null, true);
    },
  }),
)
subirFoto(
  @Param('id') id: string,
  @UploadedFile() file: Express.Multer.File,
) {
  return this.personasService.subirFotoPerfil(Number(id), file);
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
