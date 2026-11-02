// src/pagos/pagos.dto.ts
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SubirComprobanteDto {
  // Nº de comprobante o referencia que muestra el banco
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referencia?: string;
}

export class RechazarPagoDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  motivo: string;
}
