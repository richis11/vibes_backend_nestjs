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

import { HostsService } from './hosts.service';
import { CrearHostDto, UpdateHostDto } from './hosts.dto';
import { SoloAdmin } from '../auth/public.decorator';
import { UsuarioActual } from '../auth/usuario.decorator';
import type { UsuarioJwt } from '../auth/usuario.decorator';

@Controller('hosts')
export class HostsController {
  constructor(private readonly hostsService: HostsService) {}

  // 🔎 GET /hosts/buscar?q=algo&page=1
  @SoloAdmin()
  @Get('buscar')
  buscar(@Query('q') q: string, @Query('page') page = '1') {
    return this.hostsService.buscarHosts(q, Number(page));
  }

  // 📄 GET /hosts
  @SoloAdmin()
  @Get()
  obtenerHosts() {
    return this.hostsService.obtenerHosts();
  }

  // 🔢 GET /hosts/:id
  @Get(':id')
  async obtenerHostPorId(
    @Param('id') id: string,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return await this.hostsService.obtenerHostPorId(Number(id), usuario);
  }

  // ➕ POST /hosts
  @Post()
  async crearHost(
    @Body() body: CrearHostDto,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.hostsService.crearHost(body, usuario);
  }

  // ✏ PUT /hosts/:id
  @Put(':id')
  actualizarHost(
    @Param('id') id: string,
    @Body() data: UpdateHostDto,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.hostsService.actualizarHost(Number(id), data, usuario);
  }

  // 🗑 DELETE /hosts/:id (soft delete)
  @Delete(':id')
  eliminarHost(
    @Param('id') id: string,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.hostsService.eliminarHost(Number(id), usuario);
  }
}
