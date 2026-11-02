// src/reservas/reservas.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export class CrearReservaDto {
  @Type(() => Number)
  @IsInt()
  casa_id: number;

  // Para usuarios normales se ignora y se usa el persona_id del token
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  guest_id?: number;

  @Matches(FECHA, { message: 'fecha_inicio debe tener formato YYYY-MM-DD' })
  fecha_inicio: string;

  @Matches(FECHA, { message: 'fecha_fin debe tener formato YYYY-MM-DD' })
  fecha_fin: string;

  // noches, precio_por_noche, subtotal, comision_plataforma y total
  // los calcula el servidor (ver precio.ts); si llegan se descartan.

  @IsOptional()
  @IsIn([
    'pendiente_pago',
    'pagada',
    'confirmada',
    'cancelada',
    'completada',
    'reembolsada',
  ])
  estado?:
    | 'pendiente_pago'
    | 'pagada'
    | 'confirmada'
    | 'cancelada'
    | 'completada'
    | 'reembolsada';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  stripe_payment_intent_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  stripe_transfer_id?: string;

  @IsOptional()
  @IsIn(['guest', 'host', 'system'])
  cancelada_por?: 'guest' | 'host' | 'system';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo_cancelacion?: string;
}

export class UpdateReservaDto extends PartialType(CrearReservaDto) {}
