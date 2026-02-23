import { Module } from '@nestjs/common';
import { CasaImagenesService } from './casa_imagenes.service';
import { CasaImagenesController } from './casa_imagenes.controller';

@Module({
  providers: [CasaImagenesService],
  controllers: [CasaImagenesController]
})
export class CasaImagenesModule {}
