import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;
  
  currentUser = signal<User | null>(null);
  isLoading = signal(true);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
    
    this.initAuth();
  }

  private async initAuth() {
    // Check current session
    const { data: { session } } = await this.supabase.auth.getSession();
    this.currentUser.set(session?.user ?? null);
    this.isLoading.set(false);

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);
    });
  }

  // Auth methods
  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signInWithGoogle() {
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  // Database access
  get client() {
    return this.supabase;
  }

  // User profile
  async getUserProfile() {
    const user = this.currentUser();
    if (!user) return null;
    
    const { data } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return data;
  }

  async updateUserProfile(updates: Record<string, unknown>) {
    const user = this.currentUser();
    if (!user) return null;
    
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Items (vocabulary, grammar, etc.)
  async getItems(filters?: {
    targetLanguage?: string;
    type?: string;
    cefrLevel?: string;
    limit?: number;
  }) {
    let query = this.supabase.from('items').select('*');
    
    if (filters?.targetLanguage) {
      query = query.eq('target_language', filters.targetLanguage);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.cefrLevel) {
      query = query.eq('cefr_level', filters.cefrLevel);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // User progress
  async getUserProgress(itemIds?: number[]) {
    const user = this.currentUser();
    if (!user) return [];
    
    let query = this.supabase
      .from('user_progress')
      .select('*, items(*)')
      .eq('user_id', user.id);
    
    if (itemIds?.length) {
      query = query.in('item_id', itemIds);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getItemsDueForReview(targetLanguage = 'en') {
    const user = this.currentUser();
    if (!user) return [];
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await this.supabase
      .from('user_progress')
      .select('*, items!inner(*)')
      .eq('user_id', user.id)
      .eq('items.target_language', targetLanguage)
      .lte('next_review', today)
      .order('next_review', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // Sessions
  async startSession(targetLanguage = 'en', sessionType = 'mixed') {
    const user = this.currentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await this.supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        target_language: targetLanguage,
        session_type: sessionType,
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async endSession(sessionId: number, stats: {
    itemsReviewed: number;
    itemsCorrect: number;
    itemsIncorrect: number;
    newItemsIntroduced: number;
    xpEarned: number;
    disciplinesPracticed: string[];
  }) {
    const { data, error } = await this.supabase
      .from('sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_minutes: null, // Will be calculated
        items_reviewed: stats.itemsReviewed,
        items_correct: stats.itemsCorrect,
        items_incorrect: stats.itemsIncorrect,
        new_items_introduced: stats.newItemsIntroduced,
        xp_earned: stats.xpEarned,
        disciplines_practiced: stats.disciplinesPracticed
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Errors
  async logError(sessionId: number, error: {
    errorType: string;
    errorCategory?: string;
    userInput: string;
    correctForm: string;
    explanation?: string;
    l1Interference?: boolean;
    interferencePattern?: string;
    itemId?: number;
    discipline?: string;
  }) {
    const user = this.currentUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error: dbError } = await this.supabase
      .from('user_errors')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        error_type: error.errorType,
        error_category: error.errorCategory,
        user_input: error.userInput,
        correct_form: error.correctForm,
        explanation: error.explanation,
        l1_interference: error.l1Interference,
        interference_pattern: error.interferencePattern,
        item_id: error.itemId,
        discipline: error.discipline
      })
      .select()
      .single();
    
    if (dbError) throw dbError;
    return data;
  }

  // L1 Patterns
  async getL1Patterns(nationalityCode = 'IT', targetLanguage = 'en') {
    const { data, error } = await this.supabase
      .from('l1_errors')
      .select('*')
      .eq('nationality_code', nationalityCode)
      .eq('target_language', targetLanguage)
      .order('frequency_rank', { ascending: true });
    
    if (error) throw error;
    return data;
  }
}
