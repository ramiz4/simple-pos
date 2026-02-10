import { CreateSsoProviderDto, SsoClaimMappingDto } from './create-sso-provider.dto';

export class UpdateSsoProviderDto {
  name?: string;
  slug?: string;
  protocol?: string;
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

  static fromCreate(dto: CreateSsoProviderDto): UpdateSsoProviderDto {
    return dto;
  }
}
