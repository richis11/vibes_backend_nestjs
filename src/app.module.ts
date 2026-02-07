import { Module } from '@nestjs/common';
import { CasasModule } from './casas/casas.module';
import { ConfigModule } from "@nestjs/config";

import { MiddlewareConsumer } from "@nestjs/common";
import { HttpLoggerMiddleware } from "./http-logger.middleware";
import { AppController } from './app/app.controller';


@Module({
  imports: [CasasModule],
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


