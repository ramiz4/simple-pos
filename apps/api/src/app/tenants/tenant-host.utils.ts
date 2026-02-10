export interface ParsedHostContext {
  host: string;
  isAdminHost: boolean;
  tenantSubdomain?: string;
}

export function normalizeHost(rawHost: string): string {
  const hostWithoutPort = rawHost.split(':')[0] ?? rawHost;
  return hostWithoutPort.trim().toLowerCase();
}

export function parseHostContext(
  rawHost: string | undefined,
  baseDomain: string,
): ParsedHostContext {
  if (!rawHost) {
    return {
      host: '',
      isAdminHost: false,
    };
  }

  const host = normalizeHost(rawHost);
  const normalizedBaseDomain = normalizeHost(baseDomain);

  if (!host || host === normalizedBaseDomain || host === 'localhost') {
    return {
      host,
      isAdminHost: false,
    };
  }

  if (!host.endsWith(`.${normalizedBaseDomain}`)) {
    return {
      host,
      isAdminHost: false,
    };
  }

  const subdomain = host.slice(0, -(normalizedBaseDomain.length + 1));

  if (!subdomain) {
    return {
      host,
      isAdminHost: false,
    };
  }

  if (subdomain === 'admin') {
    return {
      host,
      isAdminHost: true,
    };
  }

  return {
    host,
    isAdminHost: false,
    tenantSubdomain: subdomain,
  };
}
