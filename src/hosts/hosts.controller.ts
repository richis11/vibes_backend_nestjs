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
import type { NuevoHost, UpdateHost } from '../db/schema_hosts';

@Controller('hosts')
export class HostsController {
  constructor(private readonly hostsService: HostsService) {}

  // 🔎 GET /hosts/buscar?q=algo&page=1
  @Get('buscar')
  buscar(@Query('q') q: string, @Query('page') page = '1') {
    return this.hostsService.buscarHosts(q, Number(page));
  }

  // 📄 GET /hosts
  @Get()
  obtenerHosts() {
    return this.hostsService.obtenerHosts();
  }

  // 🔢 GET /hosts/:id
  @Get(':id')
  async obtenerHostPorId(@Param('id') id: string) {
    return await this.hostsService.obtenerHostPorId(Number(id));
  }

  // ➕ POST /hosts
  @Post()
  async crearHost(@Body() body: NuevoHost) {
    return this.hostsService.crearHost(body);
  }

  // ✏ PUT /hosts/:id
  @Put(':id')
  actualizarHost(@Param('id') id: string, @Body() data: UpdateHost) {
    return this.hostsService.actualizarHost(Number(id), data);
  }

  // 🗑 DELETE /hosts/:id (soft delete)
  @Delete(':id')
  eliminarHost(@Param('id') id: string) {
    return this.hostsService.eliminarHost(Number(id));
  }
}
