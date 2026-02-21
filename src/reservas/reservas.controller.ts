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
import type { NuevaReserva, UpdateReserva } from '../db/schema_reservas';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

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
