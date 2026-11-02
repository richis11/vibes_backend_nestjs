// src/auth/password.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export function esHashBcrypt(valor: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(valor);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Compara contra el hash guardado. Si el valor guardado aún es texto plano
// (usuarios creados antes de bcrypt), compara directo para no bloquearlos.
export async function verificarPassword(
  password: string,
  guardado: string,
): Promise<boolean> {
  if (esHashBcrypt(guardado)) {
    return bcrypt.compare(password, guardado);
  }
  return password === guardado;
}
