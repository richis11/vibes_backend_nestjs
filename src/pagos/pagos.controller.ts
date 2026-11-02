// src/pagos/pagos.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PagosService } from './pagos.service';
import { RechazarPagoDto, SubirComprobanteDto } from './pagos.dto';
import { SoloAdmin } from '../auth/public.decorator';
import { UsuarioActual } from '../auth/usuario.decorator';
import type { UsuarioJwt } from '../auth/usuario.decorator';

const ESTADOS_PAGO = ['en_revision', 'aprobado', 'rechazado'] as const;

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  // GET /pagos?estado=en_revision (admin)
  @SoloAdmin()
  @Get()
  listar(@Query('estado') estado?: string) {
    if (estado && !(ESTADOS_PAGO as readonly string[]).includes(estado)) {
      throw new BadRequestException(`estado debe ser uno de: ${ESTADOS_PAGO.join(', ')}`);
    }
    return this.pagosService.listar(estado as (typeof ESTADOS_PAGO)[number]);
  }

  // GET /pagos/mios
  @Get('mios')
  misPagos(@UsuarioActual() usuario: UsuarioJwt) {
    return this.pagosService.misPagos(usuario);
  }

  // GET /pagos/reserva/:reservaId
  @Get('reserva/:reservaId')
  pagosDeReserva(
    @Param('reservaId', ParseIntPipe) reservaId: number,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.pagosService.pagosDeReserva(reservaId, usuario);
  }

  // POST /pagos/reserva/:reservaId/comprobante (multipart: comprobante, referencia?)
  @Post('reserva/:reservaId/comprobante')
  @UseInterceptors(
    FileInterceptor('comprobante', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máx
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          return cb(
            new BadRequestException('El comprobante debe ser una imagen (foto o captura)'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  subirComprobante(
    @Param('reservaId', ParseIntPipe) reservaId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() data: SubirComprobanteDto,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.pagosService.subirComprobante(reservaId, file, data, usuario);
  }

  // PUT /pagos/:id/aprobar (admin)
  @SoloAdmin()
  @Put(':id/aprobar')
  aprobar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.pagosService.aprobar(id, usuario);
  }

  // PUT /pagos/:id/rechazar (admin)
  @SoloAdmin()
  @Put(':id/rechazar')
  rechazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: RechazarPagoDto,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.pagosService.rechazar(id, data.motivo, usuario);
  }
}
