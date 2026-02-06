import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { CasasModule } from './casas/casas.module';
import { ConfigModule } from "@nestjs/config";

import { MiddlewareConsumer } from "@nestjs/common";
import { HttpLoggerMiddleware } from "./http-logger.middleware";


@Module({
  imports: [CasasModule],
})

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
})


@Module({
  imports: [CasasModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes("*");
  }
}


