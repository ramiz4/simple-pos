export const TENANT_PLAN_VALUES = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'] as const;

export type TenantPlan = (typeof TENANT_PLAN_VALUES)[number];

export interface TenantPlanConfig {
  maxUsers: number;
  maxLocations: number;
  maxDevices: number;
  features: string[];
  trialDays: number;
}

const PLAN_CONFIGS: Record<TenantPlan, TenantPlanConfig> = {
  FREE: {
    maxUsers: 2,
    maxLocations: 1,
    maxDevices: 1,
    features: ['BASIC_POS'],
    trialDays: 14,
  },
  BASIC: {
    maxUsers: 5,
    maxLocations: 1,
    maxDevices: 3,
    features: ['BASIC_POS', 'KITCHEN_DISPLAY'],
    trialDays: 14,
  },
  PRO: {
    maxUsers: 20,
    maxLocations: 3,
    maxDevices: 10,
    features: ['BASIC_POS', 'KITCHEN_DISPLAY', 'ANALYTICS', 'MULTI_LOCATION'],
    trialDays: 14,
  },
  ENTERPRISE: {
    maxUsers: 100,
    maxLocations: 20,
    maxDevices: 50,
    features: [
      'BASIC_POS',
      'KITCHEN_DISPLAY',
      'ANALYTICS',
      'MULTI_LOCATION',
      'SSO',
      'CUSTOM_DOMAIN',
    ],
    trialDays: 30,
  },
};

export function normalizeTenantPlan(plan: string | undefined): TenantPlan {
  if (!plan) {
    return 'FREE';
  }

  const upper = plan.toUpperCase();
  return TENANT_PLAN_VALUES.includes(upper as TenantPlan) ? (upper as TenantPlan) : 'FREE';
}

export function getTenantPlanConfig(plan: string | undefined): TenantPlanConfig {
  return PLAN_CONFIGS[normalizeTenantPlan(plan)];
}
