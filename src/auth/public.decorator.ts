// src/auth/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const SOLO_ADMIN_KEY = 'soloAdmin';
export const SoloAdmin = () => SetMetadata(SOLO_ADMIN_KEY, true);
