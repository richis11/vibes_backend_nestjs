// src/hosts/hosts.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsDecimalCampo } from '../common/decimal.decorator';

export class CrearHostDto {
  // Para usuarios normales se ignora y se usa el persona_id del token
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  persona_id?: number;

  @IsOptional()
  @IsBoolean()
  verificado?: boolean;

  @IsOptional()
  @IsDecimalCampo()
  rating?: string;

  @IsOptional()
  @IsIn(['activo', 'suspendido', 'eliminado'])
  estado?: 'activo' | 'suspendido' | 'eliminado';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  stripe_account_id?: string;

  @IsOptional()
  @IsBoolean()
  stripe_onboarding_completed?: boolean;
}

export class UpdateHostDto extends PartialType(CrearHostDto) {}
