
export type CategoryType = "need" | "want" | "savings";

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

export type Expense = {
  id: string;
  amount: number;
  categoryId: string;
  notes: string;
  date: string; // ISO 8601 string
};

export type Income = {
  id: string;
  amount: number;
  source: string;
  date: string; // ISO 8601 string
};

export type Budget = {
  categoryId: string;
  amount: number;
};

export type BudgetTarget = {
    amount: number;
    period: 'daily' | 'weekly' | 'monthly';
}

export type SinkingFund = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}
