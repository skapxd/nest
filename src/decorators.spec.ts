import 'reflect-metadata';

import { INJECTABLE_WATERMARK } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';

import * as publicApi from './index';
import { Dto } from './dto';
import { SKAPXD_LAYER, UseCase } from './layer';

type ReflectWithMetadata = typeof Reflect & {
  defineMetadata?: (
    metadataKey: string,
    metadataValue: unknown,
    target: object,
  ) => void;
  getMetadata: (metadataKey: string, target: object) => unknown;
};

const metadataReflect = Reflect as ReflectWithMetadata;

describe('UseCase', () => {
  it('applies Nest injectable metadata and the skapxd layer metadata', () => {
    class CreateInvoiceUseCase {}

    UseCase()(CreateInvoiceUseCase);

    expect(metadataReflect.getMetadata(INJECTABLE_WATERMARK, CreateInvoiceUseCase)).toBe(true);
    expect(metadataReflect.getMetadata(SKAPXD_LAYER, CreateInvoiceUseCase)).toBe('use-case');
  });
});

describe('Dto', () => {
  it('sets the dto layer metadata without making the class injectable', () => {
    class InvoiceResponseDto {}

    Dto()(InvoiceResponseDto);

    expect(metadataReflect.getMetadata(SKAPXD_LAYER, InvoiceResponseDto)).toBe('dto');
    expect(metadataReflect.getMetadata(INJECTABLE_WATERMARK, InvoiceResponseDto)).toBeUndefined();
  });

  it('is a safe no-op when reflect-metadata is not loaded', () => {
    class PlainDto {}
    const originalDescriptor = Object.getOwnPropertyDescriptor(Reflect, 'defineMetadata');

    try {
      Object.defineProperty(Reflect, 'defineMetadata', {
        configurable: true,
        value: undefined,
      });

      expect(() => Dto()(PlainDto)).not.toThrow();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(Reflect, 'defineMetadata', originalDescriptor);
      }
    }
  });
});

describe('public API', () => {
  it('exports only the marker names consumed by eslint rules', () => {
    expect(Object.keys(publicApi).sort()).toEqual(['Dto', 'SKAPXD_LAYER', 'UseCase']);
  });
});
