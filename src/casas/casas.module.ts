// src/casas/casas.module.ts
import { Module } from '@nestjs/common';
import { CasasController } from './casas.controller';
import { CasasService } from './casas.service';
import { PineconeModule } from '../pinecone/pinecone.module';



@Module({
  imports: [PineconeModule],    // 👈 importar para que CasasService pueda usar PineconeService
  controllers: [CasasController],
  providers: [CasasService],
})
export class CasasModule {}



// import { Module } from '@nestjs/common';
// import { CasasController } from './casas.controller';
// import { CasasService } from './casas.service';

// @Module({
//   controllers: [CasasController],
//   providers: [CasasService]
// })
// export class CasasModule {}
