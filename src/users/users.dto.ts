// src/users/users.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CrearUserDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  // Se recibe en texto plano y el servicio lo hashea
  @IsString()
  @MinLength(6)
  password_hash: string;

  @IsOptional()
  @IsBoolean()
  is_admin?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  stripe_customer_id?: string;

  @IsOptional()
  @IsIn(['activo', 'suspendido', 'eliminado'])
  estado?: 'activo' | 'suspendido' | 'eliminado';
}

export class UpdateUserDto extends PartialType(CrearUserDto) {}
