import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {

  @Get()
  root() {
    return {
      message: 'API de Vibes 🚀',
      status: 'online',
      version: "1.0"
    };
  }
}
