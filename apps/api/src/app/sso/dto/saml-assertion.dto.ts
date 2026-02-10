export class SsoSamlAssertionDto {
  tenantId?: string;
  subject?: string;
  email!: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}
