export interface SsoClaimMappingDto {
  emailClaim?: string;
  firstNameClaim?: string;
  lastNameClaim?: string;
  rolesClaim?: string;
  defaultRole?: string;
  autoProvisionUsers?: boolean;
  syncRoleOnLogin?: boolean;
  allowedEmailDomain?: string;
}

export class CreateSsoProviderDto {
  name!: string;
  slug?: string;
  protocol!: string;
  enabled?: boolean;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  issuer?: string;
  entryPoint?: string;
  callbackUrl?: string;
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  roleMappings?: Record<string, string[]>;
  claimMapping?: SsoClaimMappingDto;
}
