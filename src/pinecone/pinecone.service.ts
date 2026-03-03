import { Injectable, Logger } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';                          // 👈 import correcto


@Injectable()
export class PineconeService {
  private readonly logger = new Logger(PineconeService.name);
  private pinecone: any;
  private openai: any;
  private readonly indexName = 'casas';

  constructor() {
    this.pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }

  // ─── Genera embedding de texto usando OpenAI ──────────────────────────────
  private async generarEmbedding(texto: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texto,
    });
    return response.data[0].embedding;
  }

  // ─── Construye el texto que se va a embeddear para una casa ───────────────
  private buildTextoCasa(casa: any): string {
    return `
      Nombre: ${casa.nombre}.
      Descripción: ${casa.descripcion || 'Sin descripción'}.
      Dirección: ${casa.direccion}.
      Precio por noche: $${casa.precio}.
      Disponibilidad: ${casa.disponibilidad || 'disponible'}.
      Estado: ${casa.estado}.
    `.trim();
  }

  // ─── Upsert de una sola casa ──────────────────────────────────────────────
 async upsertCasa(casa: any): Promise<void> {
  try {
    const texto = this.buildTextoCasa(casa);
    this.logger.log(`Texto para embedding: ${texto}`);        // 👈
    
    const embedding = await this.generarEmbedding(texto);
    this.logger.log(`Embedding dims: ${embedding?.length}`);  // 👈

    const index = this.pinecone.index(this.indexName, process.env.PINECONE_HOST!);

    await index.upsert({
  records: [
    {
      id: String(casa.id),
      values: Array.from(embedding),
      metadata: {
        id: Number(casa.id),
        nombre: String(casa.nombre),
        descripcion: String(casa.descripcion || ''),
        direccion: String(casa.direccion),
        precio: Number(casa.precio),
        disponibilidad: String(casa.disponibilidad || 'disponible'),
        estado: String(casa.estado),
      },
    },
  ],
});

    this.logger.log(`✅ Casa ${casa.id} sincronizada`);
  } catch (error) {
    this.logger.error(`Error casa ${casa.id}: ${error.message}`);
    this.logger.error(`Stack: ${error.stack}`);               // 👈 stack completo
    throw error;
  }
}

  // ─── Eliminar una casa del índice ─────────────────────────────────────────
  async eliminarCasa(id: number): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName, process.env.PINECONE_HOST!);
      await index.deleteOne(String(id));
      this.logger.log(`Casa ${id} eliminada de Pinecone`);
    } catch (error) {
      this.logger.error(`Error al eliminar casa ${id} de Pinecone: ${error.message}`);
      throw error;
    }
  }

  // ─── Sincronización masiva de todas las casas ─────────────────────────────
  async sincronizarTodas(casas: any[]): Promise<{ total: number; ok: number; errores: number }> {
    let ok = 0;
    let errores = 0;

    for (const casa of casas) {
      try {
        await this.upsertCasa(casa);
        ok++;
      } catch {
        errores++;
      }
    }

    this.logger.log(`Sincronización completa: ${ok} ok, ${errores} errores`);
    return { total: casas.length, ok, errores };
  }
}