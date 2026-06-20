# @skapxd/nest

Runtime markers for NestJS layer contracts enforced by `@skapxd/eslint-opinionated`.

The package exports only the markers the linter can verify structurally:

- `@Dto()` marks the request or response objects that cross the HTTP boundary.
- `@UseCase()` marks the application boundary that a controller injects.
- `SKAPXD_LAYER` is the runtime metadata key (`Symbol.for('skapxd:layer')`) used for optional introspection when `reflect-metadata` is available.

The lower layer is intentionally not marked. A repository, provider, or domain service is inferred by discard: it is an `@Injectable` that is not `@UseCase` and not `@Controller`. Adding `@Repository`, `@Provider`, or `@DomainService` now would sell a semantic guarantee that ESLint cannot prove from AST alone. `@Repository` may still make sense later for a concrete ORM rule, for example enforcing that `@InjectModel` or Mongoose imports only appear in repository classes.

## Why this exists

The model comes from:

- [skapxd/eslint-opinionated#141](https://github.com/skapxd/eslint-opinionated/issues/141): lower layers model runtime/package failures with `Result`; Nest application boundaries translate those failures into constructed HTTP exceptions.
- [skapxd/eslint-opinionated#146](https://github.com/skapxd/eslint-opinionated/issues/146): rules detect layers by decorator name plus import source, with the MVP reduced to `@Dto` and `@UseCase`.

The linter depends on stable names and import origin, not on this package's internal implementation. Keep imports explicit:

```ts
import { Dto, UseCase } from '@skapxd/nest';
```

## `@Dto`

`@Dto` marks the shape exchanged with the client:

```ts
import { Dto } from '@skapxd/nest';

@Dto()
export class CreateUserRequestDto {
  email!: string;
}
```

Intention: a DTO is transport structure only. It has no business logic, no mutable domain state, and is not injected. A database entity (`@Schema` or `@Entity`) must not be used as a DTO; the explicit marker gives the rule a whitelist instead of a fragile blacklist.

`@Dto` writes `"dto"` under the imported `SKAPXD_LAYER` key when `reflect-metadata` is loaded. Without `Reflect.defineMetadata`, it is a safe no-op because the linter cares about the decorator export name and import source.

Phase 2 is deliberately not implemented: if a DTO extends `StreamableFile`, `@Dto` may later register Swagger binary schema metadata (`type: string`, `format: binary`) so `Promise<PdfFileDto>` documents a download.

## `@UseCase`

`@UseCase` replaces `@Injectable()` on application use-cases:

```ts
import { UseCase } from '@skapxd/nest';

@UseCase()
export class CreateUserUseCase {
  async execute(input: CreateUserRequestDto): Promise<CreateUserResponseDto> {
    // Consume Result from lower-layer services and throw constructed HttpException on failure.
  }
}
```

Intention: a use-case orchestrates one business flow, typically one endpoint. It is the application boundary where a lower-layer `Result` becomes a constructed `HttpException`; it does not return `Result`. Controllers inject use-cases. Use-cases inject lower-layer services, repositories, or providers.

`@UseCase` is composed with Nest's `@Injectable()` and writes `"use-case"` under the imported `SKAPXD_LAYER` key.

Read metadata by importing the exported key, not by using the string manually:

```ts
import { SKAPXD_LAYER } from '@skapxd/nest';

Reflect.getMetadata(SKAPXD_LAYER, CreateUserUseCase);
```

## Publishing

This package is configured for npm Trusted Publishing through GitHub Actions OIDC. There is no `NPM_TOKEN` in the workflow. Publishing runs from `.github/workflows/ci.yml` when a GitHub Release is published.

The package owner must create the Trusted Publisher in npm for package `@skapxd/nest` with:

- GitHub repository: `skapxd/nest`
- Workflow: `ci.yml`

Without that npm-side configuration, `npm publish --access public` from CI will fail, commonly as a scoped package `404`.
