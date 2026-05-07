export interface MeUser {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  emailVerifiedAt: string | null;
  locale: 'EN' | 'RU';
}

export interface Plan {
  id: string;
  code: 'HOBBY' | 'PRO' | 'TEAM';
  name: string;
  description: string | null;
  priceMonthlyRub: number;
  priceYearlyRub: number;
  panesLimit: number;
  workspacesLimit: number;
  features: string[];
}

export interface Subscription {
  id: string;
  planId: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  interval: 'MONTH' | 'YEAR';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  plan: Plan;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amountRub: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  description: string | null;
  paidAt: string | null;
  createdAt: string;
}
