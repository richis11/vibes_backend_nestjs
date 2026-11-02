// src/common/decimal.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNumberString } from 'class-validator';

// Columnas DECIMAL: Drizzle las maneja como string, pero el frontend
// puede mandar número o string. Acepta ambos y guarda string.
export function IsDecimalCampo() {
  return applyDecorators(
    Transform(({ value }) => (typeof value === 'number' ? String(value) : value)),
    IsNumberString(),
  );
}
