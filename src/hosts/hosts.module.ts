import { Module } from '@nestjs/common';
import { HostsService } from './hosts.service';
import { HostsController } from './hosts.controller';

@Module({
  providers: [HostsService],
  controllers: [HostsController]
})
export class HostsModule {}
