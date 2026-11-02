// src/reservas/precio.ts
import { BadRequestException } from '@nestjs/common';

export const COMISION_PLATAFORMA = 0.1; // 10%
export const MONEDA = 'USD'; // el frontend muestra y siempre ha enviado USD

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// "2026-02-03" -> timestamp UTC; rechaza fechas inexistentes como 2026-02-30
function parsearFecha(fecha: string, campo: string): number {
  const [y, m, d] = fecha.split('-').map(Number);
  const ts = Date.UTC(y, m - 1, d);
  const real = new Date(ts);
  if (
    real.getUTCFullYear() !== y ||
    real.getUTCMonth() !== m - 1 ||
    real.getUTCDate() !== d
  ) {
    throw new BadRequestException(`${campo} no es una fecha válida`);
  }
  return ts;
}

export function calcularNoches(fecha_inicio: string, fecha_fin: string) {
  const inicio = parsearFecha(fecha_inicio, 'fecha_inicio');
  const fin = parsearFecha(fecha_fin, 'fecha_fin');
  const noches = Math.round((fin - inicio) / MS_POR_DIA);
  if (noches < 1) {
    throw new BadRequestException(
      'fecha_fin debe ser posterior a fecha_inicio',
    );
  }
  return noches;
}

const aCentavos = (monto: string) => Math.round(Number(monto) * 100);
const aDecimal = (centavos: number) => (centavos / 100).toFixed(2);

// El huésped paga subtotal + comisión de la plataforma
export function calcularPrecioReserva(
  precioPorNoche: string,
  fecha_inicio: string,
  fecha_fin: string,
) {
  const noches = calcularNoches(fecha_inicio, fecha_fin);
  const subtotal = aCentavos(precioPorNoche) * noches;
  const comision = Math.round(subtotal * COMISION_PLATAFORMA);

  return {
    noches,
    precio_por_noche: aDecimal(aCentavos(precioPorNoche)),
    subtotal: aDecimal(subtotal),
    comision_plataforma: aDecimal(comision),
    total: aDecimal(subtotal + comision),
    moneda: MONEDA,
  };
}
