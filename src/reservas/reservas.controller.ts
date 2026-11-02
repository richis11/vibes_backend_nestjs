// src/reservas/reservas.controller.ts
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
import { ReservasService } from './reservas.service';
import { CrearReservaDto, UpdateReservaDto } from './reservas.dto';
import { Public, SoloAdmin } from '../auth/public.decorator';
import { UsuarioActual } from '../auth/usuario.decorator';
import type { UsuarioJwt } from '../auth/usuario.decorator';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

// GET /reservas/casa/:casaId/fechas-ocupadas  (público)
@Public()
@Get('casa/:casaId/fechas-ocupadas')
async obtenerFechasOcupadas(@Param('casaId') casaId: string) {
  return await this.reservasService.obtenerFechasOcupadas(Number(casaId));
}

  // GET /reservas/buscar?q=algo&page=1
  @SoloAdmin()
  @Get('buscar')
  buscar(@Query('q') q: string, @Query('page') page = '1') {
    return this.reservasService.buscarReservas(q, Number(page));
  }

  // GET /reservas - todas las reservas
  @SoloAdmin()
  @Get()
  obtenerReservas() {
    return this.reservasService.obtenerReservas();
  }

  // GET /reservas/guest/:guestId
  @Get('guest/:guestId')
  async obtenerReservasPorGuest(
    @Param('guestId') guestId: string,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return await this.reservasService.obtenerReservasPorGuest(
      Number(guestId),
      usuario,
    );
  }
  // GET /reservas/host/:hosttId
  @Get('host/:hostId')
  async obtenerReservasPorHost(
    @Param('hostId') hostId: string,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return await this.reservasService.obtenerReservasPorHost(
      Number(hostId),
      usuario,
    );
  }

  // GET /reservas/:id
  @Get(':id')
  async obtenerReservaPorId(
    @Param('id') id: string,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return await this.reservasService.obtenerReservaPorId(Number(id), usuario);
  }

  // POST /reservas
  @Post()
  async crearReserva(
    @Body() body: CrearReservaDto,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.reservasService.crearReserva(body, usuario);
  }

  // PUT /reservas/:id
  @Put(':id')
  actualizarReserva(
    @Param('id') id: string,
    @Body() data: UpdateReservaDto,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.reservasService.actualizarReserva(Number(id), data, usuario);
  }

  // DELETE /reservas/:id (soft delete)
  @Delete(':id')
  eliminarReserva(
    @Param('id') id: string,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.reservasService.eliminarReserva(Number(id), usuario);
  }
}
