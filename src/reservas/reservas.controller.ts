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
  UseGuards,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { ReservasService } from './reservas.service';
import type { NuevaReserva, UpdateReserva } from '../db/schema_reservas';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reservas')
@UseGuards(JwtAuthGuard) // 👈 Todas las rutas de reservas requieren autenticación
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

// GET /reservas/casa/:casaId/fechas-ocupadas  (público)
@Public()
@Get('casa/:casaId/fechas-ocupadas')
async obtenerFechasOcupadas(@Param('casaId') casaId: string) {
  return await this.reservasService.obtenerFechasOcupadas(Number(casaId));
}

  // GET /reservas/buscar?q=algo&page=1
  @Get('buscar')
  buscar(@Query('q') q: string, @Query('page') page = '1') {
    return this.reservasService.buscarReservas(q, Number(page));
  }

  // GET /reservas - todas las reservas
  @Get()
  obtenerReservas() {
    return this.reservasService.obtenerReservas();
  }

  // GET /reservas/guest/:guestId
  @Get('guest/:guestId')
  async obtenerReservasPorGuest(@Param('guestId') guestId: string) {
    return await this.reservasService.obtenerReservasPorGuest(Number(guestId));
  }
  // GET /reservas/host/:hosttId
  @Get('host/:hostId')
  async obtenerReservasPorHost(@Param('hostId') hostId: string) {
    return await this.reservasService.obtenerReservasPorHost(Number(hostId));
  }

  // GET /reservas/:id
  @Get(':id')
  async obtenerReservaPorId(@Param('id') id: string) {
    return await this.reservasService.obtenerReservaPorId(Number(id));
  }

  // POST /reservas
  @Post()
  async crearReserva(@Body() body: NuevaReserva) {
    return this.reservasService.crearReserva(body);
  }

  // PUT /reservas/:id
  @Put(':id')
  actualizarReserva(@Param('id') id: string, @Body() data: UpdateReserva) {
    return this.reservasService.actualizarReserva(Number(id), data);
  }

  // DELETE /reservas/:id (soft delete)
  @Delete(':id')
  eliminarReserva(@Param('id') id: string) {
    return this.reservasService.eliminarReserva(Number(id));
  }
}
