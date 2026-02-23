import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  UploadedFile,
  UseInterceptors,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CasaImagenesService } from './casa_imagenes.service';
import { memoryStorage } from 'multer';

@Controller('casa-imagenes')
export class CasaImagenesController {
  constructor(private readonly casaImagenesService: CasaImagenesService) {}

  // POST /casa-imagenes/upload/:casaId
  @Post('upload/:casaId')
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: memoryStorage(), // en memoria, sin disco
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máx
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          return cb(new Error('Solo se permiten imágenes'), false);
        }
        cb(null, true);
      },
    }),
  )
  subirImagen(
    @Param('casaId', ParseIntPipe) casaId: number,
    @UploadedFile() file: Express.Multer.File,
    @Query('principal') principal?: string,
  ) {
    const esPrincipal = principal === 'true';
    return this.casaImagenesService.subirImagen(casaId, file, esPrincipal);
  }

  // GET /casa-imagenes/:casaId
  @Get(':casaId')
  obtenerImagenes(@Param('casaId', ParseIntPipe) casaId: number) {
    return this.casaImagenesService.obtenerImagenesPorCasa(casaId);
  }

  // PATCH /casa-imagenes/:casaId/principal/:imagenId
  @Patch(':casaId/principal/:imagenId')
  marcarPrincipal(
    @Param('casaId', ParseIntPipe) casaId: number,
    @Param('imagenId', ParseIntPipe) imagenId: number,
  ) {
    return this.casaImagenesService.marcarPrincipal(casaId, imagenId);
  }

  // DELETE /casa-imagenes/:imagenId
  @Delete(':imagenId')
  eliminarImagen(@Param('imagenId', ParseIntPipe) imagenId: number) {
    return this.casaImagenesService.eliminarImagen(imagenId);
  }
}