import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

@Controller()
export class AppController {

  @Public()
  @Get()
  root() {
    return {
      message: 'API de Vibes 🚀',
      status: 'online',
      version: "1.0"
    };
  }
}
