// src/casas/casas.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsDecimalCampo } from '../common/decimal.decorator';

export class CrearCasaDto {
  // Para anfitriones se ignora y se usa su propio host
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  host_id?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  direccion: string;

  @IsDecimalCampo()
  precio: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  disponibilidad?: string;

  @IsOptional()
  @IsIn(['activa', 'inactiva', 'suspendida', 'eliminada'])
  estado?: 'activa' | 'inactiva' | 'suspendida' | 'eliminada';
}

export class UpdateCasaDto extends PartialType(CrearCasaDto) {}
