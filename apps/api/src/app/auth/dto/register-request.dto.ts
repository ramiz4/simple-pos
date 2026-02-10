export class RegisterRequestDto {
  businessName!: string;
  subdomain!: string;
  ownerFirstName!: string;
  ownerLastName!: string;
  email!: string;
  password!: string;
  timezone?: string;
  currency?: string;
  language?: string;
  taxRate?: number;
}
