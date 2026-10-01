import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

import { User } from './User';

export class HealthMetric extends Model {
  static table = 'health_metrics';

  static associations = {
    user: { type: 'belongs_to' as const, key: 'user_id' },
  };

  @field('user_id') userId!: string;
  @field('date') date!: number;
  @field('steps') steps!: number;
  @field('steps_goal') stepsGoal!: number;
  @field('calories') calories!: number;
  @field('sleep_hours') sleepHours!: number;
  @field('heart_rate') heartRate!: number;
  @field('weight') weight!: number | null;
  @field('workouts') workouts!: number;
  @field('water_intake') waterIntake!: number | null;
  @readonly @date('created_at') createdAt!: number;

  @relation('users', 'user_id') user!: User;

  get stepsProgress(): number {
    return this.stepsGoal > 0 ? this.steps / this.stepsGoal : 0;
  }

  get stepsRemaining(): number {
    return Math.max(0, this.stepsGoal - this.steps);
  }

  get sleepQuality(): number {
    if (this.sleepHours >= 8) return 100;
    if (this.sleepHours >= 7) return 85;
    if (this.sleepHours >= 6) return 70;
    if (this.sleepHours >= 5) return 50;
    return 30;
  }

  async updateSteps(steps: number): Promise<void> {
    await this.update((metric) => {
      metric.steps = steps;
    });
  }

  async updateSleep(hours: number): Promise<void> {
    await this.update((metric) => {
      metric.sleepHours = hours;
    });
  }

  async updateHeartRate(rate: number): Promise<void> {
    await this.update((metric) => {
      metric.heartRate = rate;
    });
  }

  async addWorkout(): Promise<void> {
    await this.update((metric) => {
      metric.workouts += 1;
    });
  }

  async updateWaterIntake(amount: number): Promise<void> {
    await this.update((metric) => {
      metric.waterIntake = amount;
    });
  }
}