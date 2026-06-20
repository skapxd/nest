# @skapxd/nest

Layer markers for NestJS contracts enforced by `@skapxd/eslint-opinionated`.

The package exports only the names the linter can verify structurally:

- `Dto(Base)` marks request or response DTOs through a mixin.
- `DtoBase` is the common base for DTOs that do not need another superclass.
- `@UseCase()` marks the application boundary that a controller injects.
- `SKAPXD_LAYER` is the shared layer key. `UseCase` uses it as Nest metadata; `Dto` uses it as a type-level brand on instances.

The lower layer is intentionally not marked. A repository, provider, or domain service is inferred by discard: it is an `@Injectable` that is not `@UseCase` and not `@Controller`. Adding `@Repository`, `@Provider`, or `@DomainService` now would sell a semantic guarantee that ESLint cannot prove from AST alone. `@Repository` may still make sense later for a concrete ORM rule, for example enforcing that `@InjectModel` or Mongoose imports only appear in repository classes.

## Why this exists

The model comes from:

- [skapxd/eslint-opinionated#141](https://github.com/skapxd/eslint-opinionated/issues/141): lower layers model runtime/package failures with `Result`; Nest application boundaries translate those failures into constructed HTTP exceptions.
- [skapxd/eslint-opinionated#146](https://github.com/skapxd/eslint-opinionated/issues/146): rules detect Nest layer boundaries from stable names and import origin.

Keep imports explicit:

```ts
import { Dto, DtoBase, UseCase } from '@skapxd/nest';
```

## `Dto` and `DtoBase`

`Dto` is a mixin, not a decorator. A decorator can write runtime metadata, but with Nest's `experimentalDecorators` it does not change the TypeScript type of the class. That makes it a weak signal for a rule that needs to validate the actual return type of a controller. A mixin returns a base class, so its members are part of the instance type inherited by the concrete DTO.

Use `DtoBase` for ordinary data DTOs:

```ts
import { DtoBase } from '@skapxd/nest';

export class CreateUserRequestDto extends DtoBase {
  email!: string;
}
```

Use `Dto(Base)` when the DTO must compose with another base class:

```ts
import { StreamableFile } from '@nestjs/common';
import { Dto } from '@skapxd/nest';

export class PdfFileDto extends Dto(StreamableFile) {}
```

Intention: a DTO is transport structure only. It has no business logic, no mutable domain state, and is not injected. A database entity (`@Schema` or `@Entity`) must not be used as a DTO; the explicit marker gives the rule a whitelist instead of a fragile blacklist.

The linter has two redundant detection signals:

- Brand: the instance type has `readonly [SKAPXD_LAYER]: "dto"` from `@skapxd/nest`.
- Base identity: `DtoBase` and the class returned by `Dto(Base)` are declared in `@skapxd/nest`, so a type-aware rule can walk the base-type chain and detect the origin.

`DtoBase` and `Dto(Base)` also provide data DTO helpers through `class-transformer`:

```ts
import { Expose, Type } from 'class-transformer';
import { DtoBase } from '@skapxd/nest';

export class AddressDto extends DtoBase {
  @Expose()
  street!: string;
}

export class UserDto extends DtoBase {
  @Expose()
  name!: string;

  @Expose()
  @Type(() => AddressDto)
  address!: AddressDto;
}

const user = UserDto.fromPrimitives({
  name: 'Ada',
  address: { street: 'Main Street' },
});

user.address instanceof AddressDto; // true
user.toPrimitives(); // { name: 'Ada', address: { street: 'Main Street' } }
```

`fromPrimitives` and `toPrimitives` are for data DTOs. They are not a universal construction contract for DTOs that wrap non-JSON resources. For example, `class PdfFileDto extends Dto(StreamableFile) {}` is valid for the linter and `instanceof StreamableFile`, but reconstructing a binary stream from primitives is not a useful API.

Breaking change from `0.1.x`: replace `@Dto() class X {}` with `class X extends DtoBase {}` or `class X extends Dto(Base) {}`.

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

## Follow-ups not in this release

- Validating DTOs with `class-validator` and deciding whether the boundary throws or lower layers return `Result` belongs in a separate release. Shipping validation here would couple marking, transformation, and error policy into one API.
- Runtime guards or runtime brands for `Dto`, and a type/runtime brand for `UseCase`, are optional future work. The current linter contract is type-aware for DTOs and decorator-aware for use-cases.

## Publishing

This package is configured for npm Trusted Publishing through GitHub Actions OIDC. There is no `NPM_TOKEN` in the workflow. Publishing runs from `.github/workflows/ci.yml` when a GitHub Release is published.

The package owner must create the Trusted Publisher in npm for package `@skapxd/nest` with:

- GitHub repository: `skapxd/nest`
- Workflow: `ci.yml`

Without that npm-side configuration, `npm publish --access public` from CI will fail, commonly as a scoped package `404`.
