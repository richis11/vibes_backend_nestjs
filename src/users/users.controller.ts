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

import { UsersService } from './users.service';
import type { UpdateUser, NuevoUser } from '../db/schema_users';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/buscar?q=algo&page=1
  @Get('buscar')
  buscar(@Query('q') q: string, @Query('page') page = '1') {
    return this.usersService.buscarUsers(q, Number(page));
  }

  // GET /users - todos los usuarios
  @Get()
  obtenerUsers() {
    return this.usersService.obtenerUsers();
  }
  // GET /users disponibles
  @Get('usersDisponibles')
  obtenerUsersDisponibles() {
    return this.usersService.obtenerUsersDisponibles();
  }

  // GET /users/:id
  @Get(':id')
  async obtenerUserPorId(@Param('id') id: string) {
    return await this.usersService.obtenerUserPorId(Number(id));
  }

  // POST /users
  @Post()
  async crearUser(@Body() body: NuevoUser) {
    console.log("DATOS RECIBIDOS:")
    console.log(body)
    return this.usersService.crearUser(body);
  }

  // PUT /users/:id
  @Put(':id')
  actualizarUser(@Param('id') id: string, @Body() data: UpdateUser) {
    return this.usersService.actualizarUser(Number(id), data);
  }

  // DELETE /users/:id
  @Delete(':id')
  eliminarUser(@Param('id') id: string) {
    return this.usersService.eliminarUser(Number(id));
  }
}
