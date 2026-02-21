import { Controller, Post, Body } from '@nestjs/common';
import type { RegisterDto } from './register.service';
import { RegisterService } from './register.service';

@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  // POST /register
  @Post()
  async register(@Body() body: RegisterDto) {
    return this.registerService.register(body);
  }
}