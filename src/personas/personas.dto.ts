// src/personas/personas.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CrearPersonaDto {
  // Para usuarios normales se ignora y se usa el del token
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  cedula?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombres: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellidos: string;

  // Los formularios mandan "" cuando el campo está vacío
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value == null ? undefined : new Date(value),
  )
  @IsDate()
  fecha_nacimiento?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  foto_url?: string;

  @IsOptional()
  @IsIn(['activo', 'eliminado'])
  estado?: 'activo' | 'eliminado';
}

export class UpdatePersonaDto extends PartialType(CrearPersonaDto) {}
