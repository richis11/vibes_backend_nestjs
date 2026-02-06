import { Module } from '@nestjs/common';
import { CasasController } from './casas.controller';
import { CasasService } from './casas.service';

@Module({
  controllers: [CasasController],
  providers: [CasasService]
})
export class CasasModule {}
