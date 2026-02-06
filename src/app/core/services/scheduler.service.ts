import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
}

export interface ReviewItem {
  id: number;
  itemId: number;
  item: {
    id: number;
    content: string;
    definition: string;
    type: string;
    cefrLevel: string;
    examples: string[];
  };
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReview: string;
  mastery: number;
  timesUsedSpontaneously: number;
  lastUsed: string | null;
}

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  private supabase = inject(SupabaseService);

  /**
   * SM-2 Spaced Repetition Algorithm
   * @param quality - 0-5 (0-2 = incorrect, 3 = hard, 4 = good, 5 = easy)
   * @param currentEF - Current ease factor
   * @param currentInterval - Current interval in days
   * @param currentReps - Current repetition count
   */
  calculateSM2(
    quality: number,
    currentEF: number,
    currentInterval: number,
    currentReps: number
  ): SM2Result {
    // Calculate new ease factor
    let newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEF = Math.max(1.3, newEF); // Minimum EF is 1.3

    let newInterval: number;
    let newReps: number;

    if (quality < 3) {
      // Incorrect answer - reset
      newReps = 0;
      newInterval = 1;
    } else {
      // Correct answer
      newReps = currentReps + 1;
      
      if (newReps === 1) {
        newInterval = 1;
      } else if (newReps === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.round(currentInterval * newEF);
      }
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    return {
      easeFactor: Math.round(newEF * 100) / 100,
      interval: newInterval,
      repetitions: newReps,
      nextReview
    };
  }

  /**
   * Get items for a study session based on priority
   * Priority order:
   * 1. Overdue reviews (40%)
   * 2. Weakness drilling (30%)
   * 3. New items (20%)
   * 4. Integration exercises (10%)
   */
  async getSessionItems(targetLanguage = 'en', sessionMinutes = 20): Promise<{
    overdueItems: ReviewItem[];
    weaknessItems: ReviewItem[];
    newItems: any[];
    integrationItems: ReviewItem[];
  }> {
    const user = this.supabase.currentUser();
    if (!user) return { overdueItems: [], weaknessItems: [], newItems: [], integrationItems: [] };

    // Calculate how many items based on session length
    // Rough estimate: 2 items per minute
    const totalItems = Math.floor(sessionMinutes * 2);
    const overdueCount = Math.floor(totalItems * 0.4);
    const weaknessCount = Math.floor(totalItems * 0.3);
    const newCount = Math.min(5, Math.floor(totalItems * 0.2)); // Max 5 new items
    const integrationCount = Math.floor(totalItems * 0.1);

    // Get overdue items
    const overdueItems = await this.getOverdueItems(targetLanguage, overdueCount);

    // Get weakness items (low mastery or usage debt)
    const weaknessItems = await this.getWeaknessItems(targetLanguage, weaknessCount);

    // Get new items
    const newItems = await this.getNewItems(targetLanguage, newCount);

    // Get integration items (items that haven't been used spontaneously)
    const integrationItems = await this.getIntegrationItems(targetLanguage, integrationCount);

    return { overdueItems, weaknessItems, newItems, integrationItems };
  }

  private async getOverdueItems(targetLanguage: string, limit: number): Promise<ReviewItem[]> {
    try {
      const data = await this.supabase.getItemsDueForReview(targetLanguage);
      return (data || []).slice(0, limit) as ReviewItem[];
    } catch {
      return [];
    }
  }

  private async getWeaknessItems(targetLanguage: string, limit: number): Promise<ReviewItem[]> {
    const user = this.supabase.currentUser();
    if (!user) return [];

    try {
      const { data } = await this.supabase.client
        .from('user_progress')
        .select('*, items!inner(*)')
        .eq('user_id', user.id)
        .eq('items.target_language', targetLanguage)
        .lt('mastery', 0.5) // Less than 50% mastery
        .order('mastery', { ascending: true })
        .limit(limit);

      return (data || []) as ReviewItem[];
    } catch {
      return [];
    }
  }

  private async getNewItems(targetLanguage: string, limit: number): Promise<any[]> {
    const user = this.supabase.currentUser();
    if (!user) return [];

    try {
      // Get item IDs the user has already seen
      const { data: progressData } = await this.supabase.client
        .from('user_progress')
        .select('item_id')
        .eq('user_id', user.id);

      const seenItemIds = (progressData || []).map(p => p.item_id);

      // Get new items not yet seen, ordered by frequency
      let query = this.supabase.client
        .from('items')
        .select('*')
        .eq('target_language', targetLanguage)
        .order('frequency_rank', { ascending: true })
        .limit(limit);

      if (seenItemIds.length > 0) {
        query = query.not('id', 'in', `(${seenItemIds.join(',')})`);
      }

      const { data } = await query;
      return data || [];
    } catch {
      return [];
    }
  }

  private async getIntegrationItems(targetLanguage: string, limit: number): Promise<ReviewItem[]> {
    const user = this.supabase.currentUser();
    if (!user) return [];

    try {
      // Items studied but never used spontaneously (usage debt)
      const { data } = await this.supabase.client
        .from('user_progress')
        .select('*, items!inner(*)')
        .eq('user_id', user.id)
        .eq('items.target_language', targetLanguage)
        .eq('times_used_spontaneously', 0)
        .gt('repetitions', 0) // At least reviewed once
        .order('last_reviewed', { ascending: true })
        .limit(limit);

      return (data || []) as ReviewItem[];
    } catch {
      return [];
    }
  }

  /**
   * Update progress after reviewing an item
   */
  async updateProgress(itemId: number, quality: number) {
    const user = this.supabase.currentUser();
    if (!user) return;

    // Get current progress
    const { data: currentProgress } = await this.supabase.client
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .single();

    const current = currentProgress || {
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0
    };

    // Calculate new values
    const sm2Result = this.calculateSM2(
      quality,
      current.ease_factor,
      current.interval_days,
      current.repetitions
    );

    // Calculate new mastery (0-1 scale)
    const newMastery = Math.min(1, (current.mastery || 0) + (quality >= 3 ? 0.1 : -0.1));

    // Upsert progress
    await this.supabase.client
      .from('user_progress')
      .upsert({
        user_id: user.id,
        item_id: itemId,
        ease_factor: sm2Result.easeFactor,
        interval_days: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        next_review: sm2Result.nextReview.toISOString().split('T')[0],
        last_reviewed: new Date().toISOString(),
        times_correct: (current.times_correct || 0) + (quality >= 3 ? 1 : 0),
        times_incorrect: (current.times_incorrect || 0) + (quality < 3 ? 1 : 0),
        mastery: Math.max(0, newMastery)
      }, {
        onConflict: 'user_id,item_id'
      });
  }

  /**
   * Log spontaneous usage of an item
   */
  async logSpontaneousUsage(itemId: number, context: string, quality: number) {
    const user = this.supabase.currentUser();
    if (!user) return;

    // Update user_progress
    const { data: currentProgress } = await this.supabase.client
      .from('user_progress')
      .select('times_used_spontaneously, usage_contexts')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .single();

    const contexts = currentProgress?.usage_contexts 
      ? JSON.parse(currentProgress.usage_contexts) 
      : [];
    
    if (!contexts.includes(context)) {
      contexts.push(context);
    }

    await this.supabase.client
      .from('user_progress')
      .upsert({
        user_id: user.id,
        item_id: itemId,
        times_used_spontaneously: (currentProgress?.times_used_spontaneously || 0) + 1,
        last_used: new Date().toISOString().split('T')[0],
        usage_contexts: JSON.stringify(contexts)
      }, {
        onConflict: 'user_id,item_id'
      });

    // Log to usage_log table
    await this.supabase.client
      .from('usage_log')
      .insert({
        user_id: user.id,
        item_id: itemId,
        context,
        was_prompted: false,
        quality
      });
  }
}
