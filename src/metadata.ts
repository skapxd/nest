/** Clave compartida para marcas de capa.
 *
 * `UseCase` la usa como metadata runtime de Nest. `Dto` la usa como brand de
 * tipo en instancias para que reglas type-aware detecten el retorno real de un
 * controller sin depender de decoradores invisibles al sistema de tipos.
 */
export const SKAPXD_LAYER: unique symbol = Symbol.for('skapxd:layer');
export type SkapxdLayer = 'dto' | 'use-case';
