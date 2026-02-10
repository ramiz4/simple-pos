export interface TenantSettingsUpdate {
  timezone?: string;
  currency?: string;
  language?: string;
  taxRate?: number;
}

export interface BillingInfoUpdate {
  email?: string;
}

export class UpdateTenantDto {
  name?: string;
  customDomain?: string | null;
  settings?: TenantSettingsUpdate;
  billingInfo?: BillingInfoUpdate;
}
