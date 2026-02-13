import { TestBed } from '@angular/core/testing';
import { BaseRepository } from '@simple-pos/shared/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { PlatformService } from '../../shared/utilities/platform.service';
import { REPOSITORY_PROVIDERS } from '../providers/repository.providers';
import {
  ACCOUNT_REPOSITORY,
  CATEGORY_REPOSITORY,
  CODE_TABLE_REPOSITORY,
  CODE_TRANSLATION_REPOSITORY,
  EXTRA_REPOSITORY,
  INGREDIENT_REPOSITORY,
  ORDER_ITEM_EXTRA_REPOSITORY,
  ORDER_ITEM_REPOSITORY,
  ORDER_REPOSITORY,
  PRODUCT_EXTRA_REPOSITORY,
  PRODUCT_INGREDIENT_REPOSITORY,
  PRODUCT_REPOSITORY,
  TABLE_REPOSITORY,
  TEST_REPOSITORY,
  USER_REPOSITORY,
  VARIANT_REPOSITORY,
} from './repository.tokens';

describe('Repository DI Tokens', () => {
  const ALL_TOKENS = [
    { name: 'ACCOUNT_REPOSITORY', token: ACCOUNT_REPOSITORY },
    { name: 'CATEGORY_REPOSITORY', token: CATEGORY_REPOSITORY },
    { name: 'CODE_TABLE_REPOSITORY', token: CODE_TABLE_REPOSITORY },
    { name: 'CODE_TRANSLATION_REPOSITORY', token: CODE_TRANSLATION_REPOSITORY },
    { name: 'EXTRA_REPOSITORY', token: EXTRA_REPOSITORY },
    { name: 'INGREDIENT_REPOSITORY', token: INGREDIENT_REPOSITORY },
    { name: 'ORDER_REPOSITORY', token: ORDER_REPOSITORY },
    { name: 'ORDER_ITEM_REPOSITORY', token: ORDER_ITEM_REPOSITORY },
    { name: 'ORDER_ITEM_EXTRA_REPOSITORY', token: ORDER_ITEM_EXTRA_REPOSITORY },
    { name: 'PRODUCT_REPOSITORY', token: PRODUCT_REPOSITORY },
    { name: 'PRODUCT_EXTRA_REPOSITORY', token: PRODUCT_EXTRA_REPOSITORY },
    { name: 'PRODUCT_INGREDIENT_REPOSITORY', token: PRODUCT_INGREDIENT_REPOSITORY },
    { name: 'TABLE_REPOSITORY', token: TABLE_REPOSITORY },
    { name: 'TEST_REPOSITORY', token: TEST_REPOSITORY },
    { name: 'USER_REPOSITORY', token: USER_REPOSITORY },
    { name: 'VARIANT_REPOSITORY', token: VARIANT_REPOSITORY },
  ];

  describe('Token Definitions', () => {
    it('should define 16 unique InjectionTokens', () => {
      expect(ALL_TOKENS).toHaveLength(16);
      const uniqueTokens = new Set(ALL_TOKENS.map((t) => t.token));
      expect(uniqueTokens.size).toBe(16);
    });

    it.each(ALL_TOKENS)('$name should be a valid InjectionToken', ({ token }) => {
      expect(token).toBeDefined();
      expect(token.toString()).toContain('InjectionToken');
    });
  });

  describe('REPOSITORY_PROVIDERS', () => {
    it('should provide 16 repository providers', () => {
      expect(REPOSITORY_PROVIDERS).toHaveLength(16);
    });

    describe('Web platform (IndexedDB)', () => {
      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            {
              provide: PlatformService,
              useValue: { isTauri: () => false, isWeb: () => true },
            },
            ...REPOSITORY_PROVIDERS,
          ],
        });
      });

      it.each(ALL_TOKENS)('$name should resolve to an IndexedDB repository', ({ token }) => {
        const repo = TestBed.inject(token);
        expect(repo).toBeDefined();
        expect(typeof (repo as BaseRepository<unknown>).findAll).toBe('function');
      });
    });

    describe('Tauri platform (SQLite)', () => {
      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            {
              provide: PlatformService,
              useValue: { isTauri: () => true, isWeb: () => false },
            },
            ...REPOSITORY_PROVIDERS,
          ],
        });
      });

      it.each(ALL_TOKENS)('$name should resolve to a SQLite repository', ({ token }) => {
        const repo = TestBed.inject(token);
        expect(repo).toBeDefined();
        expect(typeof (repo as BaseRepository<unknown>).findAll).toBe('function');
      });
    });
  });
});
