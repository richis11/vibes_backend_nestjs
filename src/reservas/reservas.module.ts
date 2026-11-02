import { Module } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { VencimientoReservasService } from './vencimiento.service';

@Module({
  providers: [ReservasService, VencimientoReservasService],
  controllers: [ReservasController]
})
export class ReservasModule {}
