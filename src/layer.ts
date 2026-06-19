import { applyDecorators, Injectable, SetMetadata } from '@nestjs/common';

/** Clave de metadata con la que cada decorador etiqueta la capa de la clase.
 *  Las reglas de @skapxd/eslint-opinionated detectan la capa por el NOMBRE del
 *  decorador y su origen de import; esta metadata es para introspeccion en
 *  runtime (requiere reflect-metadata). */
export const SKAPXD_LAYER = 'skapxd:layer';
export type SkapxdLayer = 'dto' | 'use-case';

/**
 * `@UseCase` -- Caso de uso de la capa de APLICACION.
 *
 * Intencion: orquesta UN flujo de negocio (tipicamente 1 endpoint = 1 use-case).
 * Es la FRONTERA donde el `Result` que devuelve la capa baja (cualquier `@Injectable`
 * que no sea `@UseCase`/`@Controller`) se traduce a una excepcion HTTP: el use-case
 * consume el Result y, si falla, lanza una `HttpException` construida (NestJS la mapea).
 * NO devuelve `Result`. Lo inyecta el `@Controller`; el use-case inyecta la capa baja.
 *
 * Lo distingue: es la CIMA de la cadena de aplicacion (cara al endpoint) y la unica
 * capa que puede lanzar excepciones HTTP. Reemplaza a `@Injectable()` en un use-case.
 */
export function UseCase(): ClassDecorator {
  return applyDecorators(Injectable(), SetMetadata(SKAPXD_LAYER, 'use-case'));
}
