import { PersonasService } from './personas.service';
import { CrearPersonaDto, UpdatePersonaDto } from './personas.dto';
import { SoloAdmin } from '../auth/public.decorator';
import { UsuarioActual } from '../auth/usuario.decorator';
import type { UsuarioJwt } from '../auth/usuario.decorator';

import { Controller, Get, Post, Body, Put, Delete, Param, Query,
  UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  // 🔎 GET /personas/buscar?q=algo&page=1
  @SoloAdmin()
  @Get('buscar')
  buscar(@Query('q') q: string, @Query('page') page = '1') {
    return this.personasService.buscarPersonas(q, Number(page));
  }

  // 📄 GET /personas
  @SoloAdmin()
  @Get()
  obtenerPersonas() {
    return this.personasService.obtenerPersonas();
  }
  // GET /users disponibles
  @SoloAdmin()
  @Get('personasDisponibles')
  obtenerPersonasDisponibles() {
    return this.personasService.obtenerPersonasDisponibles();
  }


  // 🔢 GET /personas/:id
  @Get(':id')
  async obtenerPersonaPorId(
    @Param('id') id: string,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return await this.personasService.obtenerPersonaPorId(Number(id), usuario);
  }

  // ➕ POST /personas
  @Post()
  async crearPersona(
    @Body() body: CrearPersonaDto,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.personasService.crearPersona(body, usuario);
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
  @UsuarioActual() usuario: UsuarioJwt,
) {
  return this.personasService.subirFotoPerfil(Number(id), file, usuario);
}

  // ✏ PUT /personas/:id
  @Put(':id')
  actualizarPersona(
    @Param('id') id: string,
    @Body() data: UpdatePersonaDto,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.personasService.actualizarPersona(Number(id), data, usuario);
  }

  // 🗑 DELETE /personas/:id (soft delete)
  @Delete(':id')
  eliminarPersona(
    @Param('id') id: string,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.personasService.eliminarPersona(Number(id), usuario);
  }
}
