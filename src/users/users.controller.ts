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
import { CrearUserDto, UpdateUserDto } from './users.dto';
import { SoloAdmin } from '../auth/public.decorator';
import { UsuarioActual } from '../auth/usuario.decorator';
import type { UsuarioJwt } from '../auth/usuario.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/buscar?q=algo&page=1
  @SoloAdmin()
  @Get('buscar')
  buscar(@Query('q') q: string, @Query('page') page = '1') {
    return this.usersService.buscarUsers(q, Number(page));
  }

  // GET /users - todos los usuarios
  @SoloAdmin()
  @Get()
  obtenerUsers() {
    return this.usersService.obtenerUsers();
  }
  // GET /users disponibles
  @SoloAdmin()
  @Get('usersDisponibles')
  obtenerUsersDisponibles() {
    return this.usersService.obtenerUsersDisponibles();
  }

  // GET /users/:id
  @Get(':id')
  async obtenerUserPorId(
    @Param('id') id: string,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return await this.usersService.obtenerUserPorId(Number(id), usuario);
  }

  // POST /users
  @SoloAdmin()
  @Post()
  async crearUser(@Body() body: CrearUserDto) {
    return this.usersService.crearUser(body);
  }

  // PUT /users/:id
  @Put(':id')
  actualizarUser(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.usersService.actualizarUser(Number(id), data, usuario);
  }

  // DELETE /users/:id
  @Delete(':id')
  eliminarUser(
    @Param('id') id: string,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.usersService.eliminarUser(Number(id), usuario);
  }
}
