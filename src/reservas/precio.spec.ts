import { BadRequestException } from '@nestjs/common';
import { calcularNoches, calcularPrecioReserva } from './precio';

describe('calcularPrecioReserva', () => {
  it('calcula noches, subtotal, comisión del 10% y total', () => {
    expect(calcularPrecioReserva('1500.00', '2026-03-10', '2026-03-13')).toEqual({
      noches: 3,
      precio_por_noche: '1500.00',
      subtotal: '4500.00',
      comision_plataforma: '450.00',
      total: '4950.00',
      moneda: 'USD',
    });
  });

  it('redondea la comisión a centavos sin errores de punto flotante', () => {
    const r = calcularPrecioReserva('333.33', '2026-01-01', '2026-01-04');
    expect(r.subtotal).toBe('999.99');
    expect(r.comision_plataforma).toBe('100.00');
    expect(r.total).toBe('1099.99');
  });

  it('cuenta bien las noches al cruzar meses y años bisiestos', () => {
    expect(calcularNoches('2028-02-28', '2028-03-01')).toBe(2);
    expect(calcularNoches('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('rechaza fechas inexistentes', () => {
    expect(() => calcularNoches('2026-02-30', '2026-03-02')).toThrow(
      BadRequestException,
    );
  });

  it('rechaza fecha_fin igual o anterior a fecha_inicio', () => {
    expect(() => calcularNoches('2026-05-10', '2026-05-10')).toThrow(
      BadRequestException,
    );
    expect(() => calcularNoches('2026-05-10', '2026-05-09')).toThrow(
      BadRequestException,
    );
  });
});
