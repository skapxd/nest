import {
  instanceToPlain,
  plainToInstance,
  type ClassConstructor,
} from 'class-transformer';

import { SKAPXD_LAYER } from './metadata';

// TypeScript requires `any[]` in the generic constructor constraint for mixin classes.
// eslint-disable-next-line skapxd/no-explicit-any
type AnyCtor = abstract new (...args: any[]) => object;
type DtoLayerInstance<TBase extends AnyCtor> = InstanceType<TBase> & {
  readonly [SKAPXD_LAYER]: 'dto';
  toPrimitives(): Record<string, unknown>;
};
type DtoLayer<TBase extends AnyCtor> = {
  readonly fromPrimitives: <T extends object>(
    this: ClassConstructor<T>,
    raw: unknown,
  ) => T;
} & (abstract new (
  ...args: ConstructorParameters<TBase>
) => DtoLayerInstance<TBase>);

abstract class EmptyDto {}

/**
 * Mixin marcador de DTO de presentacion.
 *
 * Intencion: declarar la FORMA/contrato de lo que entra o sale por el
 * controller. Como mixin, no como decorador, deja una marca visible en el tipo
 * de la instancia (`[SKAPXD_LAYER]: "dto"`) para reglas type-aware y agrega
 * helpers de serializacion basados en la metadata de `class-transformer`
 * (`@Type`, `@Expose`).
 *
 * Uso comun: `class UserDto extends Dto() {}`.
 * Con otra base: `class PdfFileDto extends Dto(StreamableFile) {}`.
 *
 * `fromPrimitives` y `toPrimitives` estan pensados para DTOs de datos. Si el
 * DTO compone con una base como `StreamableFile`, la marca de capa sigue siendo
 * util, pero reconstruir un stream binario desde JSON no es un contrato valido.
 */
export function Dto(): DtoLayer<typeof EmptyDto>;
export function Dto<TBase extends AnyCtor>(Base: TBase): DtoLayer<TBase>;
export function Dto(Base: AnyCtor = EmptyDto) {
  abstract class DtoLayer extends Base {
    declare readonly [SKAPXD_LAYER]: 'dto';

    static readonly fromPrimitives = function fromPrimitives<T extends object>(
      this: ClassConstructor<T>,
      raw: unknown,
    ): T {
      return plainToInstance(this, raw);
    };

    toPrimitives(): Record<string, unknown> {
      return instanceToPlain(this);
    }
  }

  return DtoLayer;
}
