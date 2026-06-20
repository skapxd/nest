/** Clave de metadata con la que cada decorador etiqueta la capa de la clase.
 *  Las reglas de @skapxd/eslint-opinionated detectan la capa por el NOMBRE del
 *  decorador y su origen de import; esta metadata es para introspeccion en
 *  runtime (requiere reflect-metadata). Usa el registro global de simbolos para
 *  conservar la misma key si existen varias copias del paquete en el proceso. */
export const SKAPXD_LAYER = Symbol.for('skapxd:layer');
export type SkapxdLayer = 'dto' | 'use-case';
