import { Q } from '@nozbe/watermelondb';

import { database } from '../database';
import type { Transaction } from '../models/Transaction';
import type { FinancialGoal } from '../models/FinancialGoal';

export interface FinanceSummary {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  budgetUsed: number;
}

export interface TransactionInput {
  userId: string;
  title: string;
  description?: string | null;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  date?: number;
  tags?: string[];
}

export const FinanceRepository = {
  async findTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    return database
      .get<Transaction>('transactions')
      .query(Q.where('user_id', userId), Q.sortBy('date', 'desc'), Q.take(limit))
      .fetch();
  },

  async findIncome(userId: string): Promise<Transaction[]> {
    return database
      .get<Transaction>('transactions')
      .query(
        Q.where('user_id', userId),
        Q.where('type', 'income'),
        Q.sortBy('date', 'desc')
      )
      .fetch();
  },

  async findExpenses(userId: string): Promise<Transaction[]> {
    return database
      .get<Transaction>('transactions')
      .query(
        Q.where('user_id', userId),
        Q.where('type', 'expense'),
        Q.sortBy('date', 'desc')
      )
      .fetch();
  },

  async sumIncome(userId: string): Promise<number> {
    const transactions = await this.findIncome(userId);
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  },

  async sumExpenses(userId: string): Promise<number> {
    const transactions = await this.findExpenses(userId);
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  },

  async findGoals(userId: string): Promise<FinancialGoal[]> {
    return database
      .get<FinancialGoal>('financial_goals')
      .query(Q.where('user_id', userId), Q.sortBy('created_at', 'desc'))
      .fetch();
  },

  async findActiveGoals(userId: string): Promise<FinancialGoal[]> {
    return database
      .get<FinancialGoal>('financial_goals')
      .query(
        Q.where('user_id', userId),
        Q.where('is_active', true),
        Q.sortBy('created_at', 'desc')
      )
      .fetch();
  },

  async summary(userId: string): Promise<FinanceSummary> {
    const [income, expenses, goals] = await Promise.all([
      this.sumIncome(userId),
      this.sumExpenses(userId),
      this.findGoals(userId),
    ]);

    const savings = goals
      .filter((g) => g.category === 'savings')
      .reduce((sum, g) => sum + g.currentAmount, 0);
    const investments = goals
      .filter((g) => g.category === 'investment')
      .reduce((sum, g) => sum + g.currentAmount, 0);
    const balance = income - expenses + savings + investments;
    const budgetUsed = income > 0 ? Math.round((expenses / income) * 100) : 0;

    return {
      balance,
      income,
      expenses,
      savings,
      investments,
      budgetUsed,
    };
  },

  async createTransaction(input: TransactionInput): Promise<Transaction> {
    return database.write(async () =>
      database.get<Transaction>('transactions').create((tx) => {
        tx.userId = input.userId;
        tx.title = input.title;
        tx.description = input.description ?? null;
        tx.amount = input.amount;
        tx.type = input.type;
        tx.category = input.category;
        tx.date = input.date ?? Date.now();
        tx.tags = input.tags ? JSON.stringify(input.tags) : null;
      })
    );
  },

  async createGoal(input: {
    userId: string;
    title: string;
    description?: string | null;
    targetAmount: number;
    currentAmount?: number;
    targetDate?: number | null;
    category: string;
    isActive?: boolean;
  }): Promise<FinancialGoal> {
    return database.write(async () =>
      database.get<FinancialGoal>('financial_goals').create((goal) => {
        goal.userId = input.userId;
        goal.title = input.title;
        goal.description = input.description ?? null;
        goal.targetAmount = input.targetAmount;
        goal.currentAmount = input.currentAmount ?? 0;
        goal.targetDate = input.targetDate ?? null;
        goal.category = input.category;
        goal.isActive = input.isActive ?? true;
      })
    );
  },

  async addGoalProgress(goal: FinancialGoal, amount: number): Promise<FinancialGoal> {
    return database.write(async () => {
      await goal.addProgress(amount);
      return goal;
    });
  },
};