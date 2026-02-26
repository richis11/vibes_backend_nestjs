// src/register/register.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import type { RegisterDto } from './register.service';
import { RegisterService } from './register.service';
import { Public } from '../auth/public.decorator';

@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Public() // 👈 Ruta pública
  @Post()
  async register(@Body() body: RegisterDto) {
    return this.registerService.register(body);
  }
}