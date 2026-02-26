// src/login/login.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { LoginService } from './login.service';
import type { LoginDto } from './login.service';
import { Public } from '../auth/public.decorator';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Public() // 👈 Ruta pública
  @Post()
  async login(@Body() body: LoginDto) {
    return this.loginService.login(body);
  }
}