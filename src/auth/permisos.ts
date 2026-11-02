// src/auth/permisos.ts
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { hosts } from '../db/schema_hosts';
import { casas } from '../db/schema_casas';
import { UsuarioJwt } from './usuario.decorator';

// Evita que Drizzle falle con un UPDATE sin columnas
export function exigirCampos<T extends object>(data: T): T {
  if (!Object.values(data).some((v) => v !== undefined)) {
    throw new BadRequestException('No hay campos para actualizar');
  }
  return data;
}

export function exigir(condicion: boolean, mensaje = 'No tienes permiso') {
  if (!condicion) throw new ForbiddenException(mensaje);
}

// El host_id del token puede estar desactualizado si el usuario se volvió
// anfitrión después de iniciar sesión, así que se consulta en la DB.
export async function hostIdDe(usuario: UsuarioJwt): Promise<number | null> {
  if (usuario.host_id) return usuario.host_id;
  if (!usuario.persona_id) return null;

  const host = await db
    .select({ id: hosts.id })
    .from(hosts)
    .where(eq(hosts.persona_id, usuario.persona_id))
    .limit(1);

  return host[0]?.id ?? null;
}

// Devuelve el host dueño de la casa (404 si no existe)
export async function hostDeCasa(casaId: number): Promise<number> {
  const casa = await db
    .select({ host_id: casas.host_id })
    .from(casas)
    .where(eq(casas.id, casaId))
    .limit(1);

  if (!casa.length) throw new NotFoundException('Casa no encontrada');
  return casa[0].host_id;
}

export async function exigirDuenoDeCasa(casaId: number, usuario: UsuarioJwt) {
  const hostId = await hostDeCasa(casaId);
  if (usuario.is_admin) return;
  exigir(hostId === (await hostIdDe(usuario)), 'Esta casa no es tuya');
}

// Quita campos que solo un admin puede modificar
export function sinCamposDeAdmin<T extends object>(
  usuario: UsuarioJwt,
  data: T,
  campos: (keyof T)[],
): T {
  if (usuario.is_admin) return data;
  const limpio = { ...data };
  for (const campo of campos) delete limpio[campo];
  return limpio;
}
