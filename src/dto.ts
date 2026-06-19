import { SKAPXD_LAYER, type SkapxdLayer } from './layer';

type ReflectWithOptionalMetadata = typeof Reflect & {
  defineMetadata?: (
    metadataKey: typeof SKAPXD_LAYER,
    metadataValue: SkapxdLayer,
    target: object,
  ) => void;
};

/**
 * `@Dto` -- Objeto de TRANSPORTE que cruza la frontera HTTP (request o response).
 *
 * Intencion: declarar la FORMA/contrato de lo que entra o sale por el controller. Solo
 * estructura -- sin logica de negocio ni estado. NO se inyecta (no es un provider): es lo
 * unico que el controller intercambia con el cliente, y lo que swagger documenta. Una
 * entidad de DB (`@Schema`/`@Entity`) NUNCA debe usarse como DTO; por eso el marcador
 * explicito.
 *
 * FASE 2 (TODO, no implementar aun salvo que sea trivial): si la clase extiende
 * `StreamableFile`, registrar su schema swagger como binario (`type: string,
 * format: binary`) para que un `: Promise<PdfFileDto>` se documente como descarga.
 */
export function Dto(): ClassDecorator {
  return (target) => {
    const reflectWithMetadata = Reflect as ReflectWithOptionalMetadata;
    const lacksReflectMetadata = typeof reflectWithMetadata.defineMetadata !== 'function';

    if (lacksReflectMetadata) {
      return;
    }

    reflectWithMetadata.defineMetadata(SKAPXD_LAYER, 'dto', target);
  };
}
