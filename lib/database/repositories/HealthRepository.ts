import { Q } from '@nozbe/watermelondb';

import { database } from '../database';
import type { HealthMetric } from '../models/HealthMetric';

export interface HealthMetricInput {
  userId: string;
  date?: number;
  steps: number;
  stepsGoal: number;
  calories: number;
  sleepHours: number;
  heartRate: number;
  weight?: number | null;
  workouts: number;
  waterIntake?: number | null;
}

export const HealthRepository = {
  async findByUser(userId: string): Promise<HealthMetric[]> {
    return database
      .get<HealthMetric>('health_metrics')
      .query(Q.where('user_id', userId), Q.sortBy('date', 'desc'))
      .fetch();
  },

  async findLatest(userId: string): Promise<HealthMetric | undefined> {
    const results = await database
      .get<HealthMetric>('health_metrics')
      .query(Q.where('user_id', userId), Q.sortBy('date', 'desc'), Q.take(1))
      .fetch();
    return results[0];
  },

  async upsertToday(userId: string, input: Omit<HealthMetricInput, 'userId'>): Promise<HealthMetric> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayStart = today.getTime();

    const existing = await database
      .get<HealthMetric>('health_metrics')
      .query(Q.where('user_id', userId), Q.where('date', dayStart))
      .fetch();

    if (existing[0]) {
      return database.write(async () => {
        await existing[0].update((metric) => {
          metric.steps = input.steps;
          metric.stepsGoal = input.stepsGoal;
          metric.calories = input.calories;
          metric.sleepHours = input.sleepHours;
          metric.heartRate = input.heartRate;
          metric.weight = input.weight ?? null;
          metric.workouts = input.workouts;
          metric.waterIntake = input.waterIntake ?? null;
        });
        return existing[0];
      });
    }

    return database.write(async () =>
      database.get<HealthMetric>('health_metrics').create((metric) => {
        metric.userId = userId;
        metric.date = dayStart;
        metric.steps = input.steps;
        metric.stepsGoal = input.stepsGoal;
        metric.calories = input.calories;
        metric.sleepHours = input.sleepHours;
        metric.heartRate = input.heartRate;
        metric.weight = input.weight ?? null;
        metric.workouts = input.workouts;
        metric.waterIntake = input.waterIntake ?? null;
      })
    );
  },

  async updateSteps(metric: HealthMetric, steps: number): Promise<HealthMetric> {
    return database.write(async () => {
      await metric.updateSteps(steps);
      return metric;
    });
  },

  async addWorkout(metric: HealthMetric): Promise<HealthMetric> {
    return database.write(async () => {
      await metric.addWorkout();
      return metric;
    });
  },

  async updateWaterIntake(metric: HealthMetric, amount: number): Promise<HealthMetric> {
    return database.write(async () => {
      await metric.updateWaterIntake(amount);
      return metric;
    });
  }
};