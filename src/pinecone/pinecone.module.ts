// src/pinecone/pinecone.module.ts
import { Module } from '@nestjs/common';
import { PineconeService } from './pinecone.service';

@Module({
  providers: [PineconeService],
  exports: [PineconeService],   // 👈 exportado para usarlo en CasasModule
})
export class PineconeModule {}