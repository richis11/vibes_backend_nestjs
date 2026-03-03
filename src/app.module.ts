// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

import { MiddlewareConsumer } from '@nestjs/common';
import { HttpLoggerMiddleware } from './http-logger.middleware';

import { AppController } from './app/app.controller';
import { CasasModule } from './casas/casas.module';
import { UsersModule } from './users/users.module';
import { PersonasModule } from './personas/personas.module';
import { HostsModule } from './hosts/hosts.module';
import { ReservasModule } from './reservas/reservas.module';
import { RegisterModule } from './register/register.module';
import { LoginModule } from './login/login.module';
import { CasaImagenesModule } from './casa_imagenes/casa_imagenes.module';

// 👇 Importar guard
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PineconeModule } from './pinecone/pinecone.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 👇 JWT disponible globalmente
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'secret_dev',
      signOptions: { expiresIn: '7d' },
    }),
    CasasModule,
    UsersModule,
    PersonasModule,
    HostsModule,
    ReservasModule,
    RegisterModule,
    LoginModule,
    CasaImagenesModule,
    PineconeModule,
  ],
  controllers: [AppController],
  providers: [
    // 👇 Guard global opcional (si quieres proteger todas las rutas por defecto)
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}