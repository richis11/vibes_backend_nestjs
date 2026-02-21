import { Controller, Post, Body } from '@nestjs/common';
import { LoginService } from './login.service';
import type{ LoginDto } from './login.service';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  // POST /login
  @Post()
  async login(@Body() body: LoginDto) {
    return this.loginService.login(body);
  }
}