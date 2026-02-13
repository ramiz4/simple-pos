import { describe, expect, it } from 'vitest';
import { parseHostContext } from './tenant-host.utils';

describe('parseHostContext', () => {
  it('detects tenant subdomain hosts', () => {
    expect(parseHostContext('shop.example.com', 'example.com')).toEqual({
      host: 'shop.example.com',
      isAdminHost: false,
      tenantSubdomain: 'shop',
    });
  });

  it('detects admin host', () => {
    expect(parseHostContext('admin.example.com', 'example.com')).toEqual({
      host: 'admin.example.com',
      isAdminHost: true,
    });
  });

  it('returns no tenant for localhost and custom domains', () => {
    expect(parseHostContext('localhost:4200', 'example.com')).toEqual({
      host: 'localhost',
      isAdminHost: false,
    });

    expect(parseHostContext('customdomain.com', 'example.com')).toEqual({
      host: 'customdomain.com',
      isAdminHost: false,
    });
  });
});
