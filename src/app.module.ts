import { Module } from '@nestjs/common';
import { CasasModule } from './casas/casas.module';
import { ConfigModule } from "@nestjs/config";

import { MiddlewareConsumer } from "@nestjs/common";
import { HttpLoggerMiddleware } from "./http-logger.middleware";
import { AppController } from './app/app.controller';
import { UsersModule } from './users/users.module';
import { PersonasModule } from './personas/personas.module';
import { HostsModule } from './hosts/hosts.module';


@Module({
  imports: [CasasModule, UsersModule, PersonasModule, HostsModule],
  controllers: [AppController],
})

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
})


export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes("*");
  }
}


