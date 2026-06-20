import 'reflect-metadata';

import { StreamableFile } from '@nestjs/common';
import { INJECTABLE_WATERMARK } from '@nestjs/common/constants';
import { Expose, Type } from 'class-transformer';
import { describe, expect, expectTypeOf, it } from 'vitest';

import * as publicApi from './index';
import { Dto, DtoBase } from './dto';
import { SKAPXD_LAYER } from './metadata';
import { UseCase } from './use-case';

type ReflectWithMetadata = typeof Reflect & {
  defineMetadata?: (
    metadataKey: string | symbol,
    metadataValue: unknown,
    target: object,
  ) => void;
  getMetadata: (metadataKey: string | symbol, target: object) => unknown;
};

const metadataReflect = Reflect as ReflectWithMetadata;
type DtoBrand = { readonly [SKAPXD_LAYER]: 'dto' };

describe('SKAPXD_LAYER', () => {
  it('uses the global symbol registry as metadata key', () => {
    expect(SKAPXD_LAYER).toBe(Symbol.for('skapxd:layer'));
  });
});

describe('UseCase', () => {
  it('applies Nest injectable metadata and the skapxd layer metadata', () => {
    class CreateInvoiceUseCase {}

    UseCase()(CreateInvoiceUseCase);

    expect(metadataReflect.getMetadata(INJECTABLE_WATERMARK, CreateInvoiceUseCase)).toBe(true);
    expect(metadataReflect.getMetadata(SKAPXD_LAYER, CreateInvoiceUseCase)).toBe('use-case');
  });
});

describe('Dto', () => {
  it('adds a type-level dto brand to instances from DtoBase and Dto(Base)', () => {
    class InvoiceResponseDto extends DtoBase {}
    class InlineResponseDto extends Dto(class InlineBase {}) {}

    const invoiceDto: DtoBrand = new InvoiceResponseDto();
    const inlineDto: DtoBrand = new InlineResponseDto();

    expectTypeOf(new InvoiceResponseDto()).toMatchTypeOf<DtoBrand>();
    expectTypeOf(new InlineResponseDto()).toMatchTypeOf<DtoBrand>();
    expect(invoiceDto).toBeInstanceOf(InvoiceResponseDto);
    expect(inlineDto).toBeInstanceOf(InlineResponseDto);
    expect(metadataReflect.getMetadata(SKAPXD_LAYER, InvoiceResponseDto)).toBeUndefined();
    expect(metadataReflect.getMetadata(INJECTABLE_WATERMARK, InvoiceResponseDto)).toBeUndefined();
  });

  it('constructs the concrete dto subtype from primitives and applies nested type metadata', () => {
    class AddressDto extends DtoBase {
      @Expose()
      street!: string;
    }

    class UserDto extends DtoBase {
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

    expectTypeOf(user).toEqualTypeOf<UserDto>();
    expect(user).toBeInstanceOf(UserDto);
    expect(user.address).toBeInstanceOf(AddressDto);
    expect(user.address.street).toBe('Main Street');
  });

  it('serializes dto instances to plain primitives', () => {
    class AddressDto extends DtoBase {
      @Expose()
      street!: string;
    }

    class UserDto extends DtoBase {
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

    expect(user.toPrimitives()).toEqual({
      name: 'Ada',
      address: { street: 'Main Street' },
    });
  });

  it('composes with another base class without losing the base instance contract', () => {
    class PdfFileDto extends Dto(StreamableFile) {}

    const file = new PdfFileDto(new Uint8Array([1, 2, 3]));
    const brandedFile: DtoBrand = file;

    expectTypeOf(file).toMatchTypeOf<DtoBrand>();
    expect(brandedFile).toBe(file);
    expect(file).toBeInstanceOf(PdfFileDto);
    expect(file).toBeInstanceOf(StreamableFile);
  });
});

describe('public API', () => {
  it('exports the marker names consumed by eslint rules', () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      'Dto',
      'DtoBase',
      'SKAPXD_LAYER',
      'UseCase',
    ]);
  });
});
