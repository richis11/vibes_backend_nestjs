// src/reservas/vencimiento.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { db } from '../db/connection';

// Horas que tiene el huésped para enviar el comprobante (desde que reserva
// o desde que le rechazaron el último). El frontend muestra el mismo número.
export const HORAS_PARA_PAGAR = 24;

@Injectable()
export class VencimientoReservasService {
  private readonly logger = new Logger(VencimientoReservasService.name);

  // Libera las fechas de reservas que nunca se pagaron. No toca las que
  // tienen un comprobante en revisión: esas las decide el admin.
  @Cron(CronExpression.EVERY_HOUR)
  async cancelarVencidas() {
    try {
      const [resultado] = await db.execute(sql`
        UPDATE reservas r
        SET r.estado = 'cancelada',
            r.cancelada_por = 'system',
            r.motivo_cancelacion = 'No se recibió el pago a tiempo'
        WHERE r.estado = 'pendiente_pago'
          AND r.created_at < NOW() - INTERVAL ${sql.raw(String(HORAS_PARA_PAGAR))} HOUR
          AND NOT EXISTS (
            SELECT 1 FROM pagos p
            WHERE p.reserva_id = r.id
              AND (
                p.estado = 'en_revision'
                OR (p.estado = 'rechazado'
                    AND p.revisado_at > NOW() - INTERVAL ${sql.raw(String(HORAS_PARA_PAGAR))} HOUR)
              )
          )
      `);

      const canceladas = (resultado as { affectedRows?: number }).affectedRows ?? 0;
      if (canceladas) {
        this.logger.log(`${canceladas} reserva(s) sin pago canceladas`);
      }
    } catch (err) {
      this.logger.error('No se pudieron cancelar reservas vencidas', err);
    }
  }
}
