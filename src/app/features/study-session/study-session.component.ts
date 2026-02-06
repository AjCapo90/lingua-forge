import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { SupabaseService } from '../../core/services/supabase.service';
import { SchedulerService } from '../../core/services/scheduler.service';

interface StudyItem {
  id: number;
  content: string;
  definition: string;
  translations: { it?: string };
  examples: string[];
  part_of_speech: string;
  cefr_level: string;
  ipa_pronunciation?: string;
  type: string;
}

type ExerciseType = 'translate_to_en' | 'translate_to_it' | 'fill_blank' | 'definition';

interface Exercise {
  item: StudyItem;
  type: ExerciseType;
  prompt: string;
  correctAnswers: string[];
  userAnswer: string;
  isCorrect: boolean | null;
  feedback: string;
}

@Component({
  selector: 'app-study-session',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="exitSession()">
        <mat-icon>close</mat-icon>
      </button>
      <span>Study Session</span>
      <span class="spacer"></span>
      <span class="progress-text">{{ currentIndex() + 1 }} / {{ exercises().length }}</span>
    </mat-toolbar>
    
    <mat-progress-bar 
      mode="determinate" 
      [value]="progressPercent()">
    </mat-progress-bar>
    
    <div class="session-container">
      @if (isLoading()) {
        <mat-card class="loading-card">
          <p>Loading exercises...</p>
        </mat-card>
      } @else if (isComplete()) {
        <!-- Session Complete -->
        <mat-card class="complete-card">
          <mat-card-header>
            <mat-card-title>🎉 Session Complete!</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stats-grid">
              <div class="stat">
                <span class="stat-value">{{ correctCount() }}</span>
                <span class="stat-label">Correct</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ exercises().length - correctCount() }}</span>
                <span class="stat-label">To Review</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ Math.round((correctCount() / exercises().length) * 100) }}%</span>
                <span class="stat-label">Accuracy</span>
              </div>
            </div>
            
            <p class="xp-earned">+{{ xpEarned() }} XP earned!</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="exitSession()">
              Back to Dashboard
            </button>
            <button mat-button (click)="restartSession()">
              Practice Again
            </button>
          </mat-card-actions>
        </mat-card>
      } @else {
        <!-- Current Exercise -->
        @let exercise = currentExercise();
        @if (exercise) {
          <mat-card class="exercise-card">
            <mat-card-header>
              <mat-chip-set>
                <mat-chip>{{ exercise.item.cefr_level }}</mat-chip>
                <mat-chip>{{ exercise.item.part_of_speech }}</mat-chip>
              </mat-chip-set>
            </mat-card-header>
            
            <mat-card-content>
              <div class="exercise-type">
                @switch (exercise.type) {
                  @case ('translate_to_en') {
                    <p class="instruction">Translate to English:</p>
                  }
                  @case ('translate_to_it') {
                    <p class="instruction">Translate to Italian:</p>
                  }
                  @case ('definition') {
                    <p class="instruction">What word matches this definition?</p>
                  }
                  @case ('fill_blank') {
                    <p class="instruction">Complete the sentence:</p>
                  }
                }
              </div>
              
              <p class="prompt">{{ exercise.prompt }}</p>
              
              @if (exercise.isCorrect === null) {
                <!-- Answer Input -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Your answer</mat-label>
                  <input matInput 
                         [(ngModel)]="userAnswer" 
                         (keyup.enter)="checkAnswer()"
                         [disabled]="isChecking()"
                         autocomplete="off">
                </mat-form-field>
                
                <button mat-raised-button color="primary" 
                        (click)="checkAnswer()" 
                        [disabled]="!userAnswer.trim() || isChecking()"
                        class="full-width">
                  Check Answer
                </button>
              } @else {
                <!-- Feedback -->
                <div class="feedback" [class.correct]="exercise.isCorrect" [class.incorrect]="!exercise.isCorrect">
                  <mat-icon>{{ exercise.isCorrect ? 'check_circle' : 'cancel' }}</mat-icon>
                  <div class="feedback-content">
                    <p class="feedback-title">
                      {{ exercise.isCorrect ? 'Correct!' : 'Not quite...' }}
                    </p>
                    <p class="your-answer">Your answer: <strong>{{ exercise.userAnswer }}</strong></p>
                    @if (!exercise.isCorrect) {
                      <p class="correct-answer">Correct: <strong>{{ exercise.correctAnswers[0] }}</strong></p>
                    }
                  </div>
                </div>
                
                <!-- Word Details -->
                <div class="word-details">
                  <h3>{{ exercise.item.content }}</h3>
                  @if (exercise.item.ipa_pronunciation) {
                    <p class="pronunciation">{{ exercise.item.ipa_pronunciation }}</p>
                  }
                  <p class="definition">{{ exercise.item.definition }}</p>
                  @if (exercise.item.translations?.it) {
                    <p class="translation">🇮🇹 {{ exercise.item.translations.it }}</p>
                  }
                  @if (exercise.item.examples?.length) {
                    <div class="examples">
                      <p class="examples-title">Examples:</p>
                      @for (example of exercise.item.examples.slice(0, 2); track example) {
                        <p class="example">• {{ example }}</p>
                      }
                    </div>
                  }
                </div>
                
                <button mat-raised-button color="primary" 
                        (click)="nextExercise()"
                        class="full-width">
                  {{ isLastExercise() ? 'Finish' : 'Next' }}
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              }
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .spacer { flex: 1 1 auto; }
    
    .progress-text {
      font-size: 14px;
      opacity: 0.9;
    }
    
    mat-progress-bar {
      position: sticky;
      top: 56px;
      z-index: 10;
    }
    
    .session-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    
    .exercise-card, .complete-card, .loading-card {
      margin-bottom: 16px;
    }
    
    .instruction {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .prompt {
      font-size: 24px;
      font-weight: 500;
      margin-bottom: 24px;
      line-height: 1.4;
    }
    
    .full-width {
      width: 100%;
    }
    
    .feedback {
      display: flex;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .feedback.correct {
      background: #e8f5e9;
      color: #2e7d32;
    }
    
    .feedback.incorrect {
      background: #ffebee;
      color: #c62828;
    }
    
    .feedback mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    
    .feedback-title {
      font-weight: 500;
      font-size: 18px;
      margin-bottom: 4px;
    }
    
    .your-answer, .correct-answer {
      font-size: 14px;
      margin: 4px 0;
    }
    
    .word-details {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .word-details h3 {
      margin: 0 0 4px 0;
      font-size: 20px;
    }
    
    .pronunciation {
      color: #666;
      font-family: monospace;
      margin-bottom: 8px;
    }
    
    .definition {
      margin-bottom: 8px;
    }
    
    .translation {
      font-style: italic;
      margin-bottom: 8px;
    }
    
    .examples-title {
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .example {
      font-size: 14px;
      color: #555;
      margin: 4px 0;
    }
    
    /* Complete Screen */
    .stats-grid {
      display: flex;
      justify-content: space-around;
      margin: 24px 0;
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-value {
      display: block;
      font-size: 32px;
      font-weight: 700;
      color: #1976d2;
    }
    
    .stat-label {
      font-size: 14px;
      color: #666;
    }
    
    .xp-earned {
      text-align: center;
      font-size: 20px;
      color: #ff9800;
      font-weight: 500;
    }
    
    mat-card-actions {
      display: flex;
      gap: 8px;
      justify-content: center;
    }
  `]
})
export class StudySessionComponent implements OnInit {
  protected Math = Math;
  
  private supabase = inject(SupabaseService);
  private scheduler = inject(SchedulerService);
  private router = inject(Router);
  
  exercises = signal<Exercise[]>([]);
  currentIndex = signal(0);
  isLoading = signal(true);
  isChecking = signal(false);
  userAnswer = '';
  
  currentExercise = computed(() => this.exercises()[this.currentIndex()] || null);
  progressPercent = computed(() => ((this.currentIndex() + 1) / Math.max(1, this.exercises().length)) * 100);
  isComplete = computed(() => !this.isLoading() && this.currentIndex() >= this.exercises().length);
  isLastExercise = computed(() => this.currentIndex() === this.exercises().length - 1);
  correctCount = computed(() => this.exercises().filter(e => e.isCorrect === true).length);
  xpEarned = computed(() => this.correctCount() * 10);

  async ngOnInit() {
    await this.loadExercises();
  }

  async loadExercises() {
    this.isLoading.set(true);
    
    try {
      // Get random items from the database
      const { data, error } = await this.supabase.client
        .from('items')
        .select('*')
        .eq('target_language', 'en')
        .limit(10);
      
      if (error) throw error;
      
      // Shuffle and create exercises
      const shuffled = this.shuffleArray(data || []);
      const exercises = shuffled.map(item => this.createExercise(item as StudyItem));
      
      this.exercises.set(exercises);
    } catch (e) {
      console.error('Failed to load exercises:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private createExercise(item: StudyItem): Exercise {
    // Randomly select exercise type
    const types: ExerciseType[] = ['translate_to_en', 'translate_to_it', 'definition'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let prompt: string;
    let correctAnswers: string[];
    
    switch (type) {
      case 'translate_to_en':
        prompt = item.translations?.it || item.definition;
        correctAnswers = [item.content.toLowerCase()];
        break;
      case 'translate_to_it':
        prompt = item.content;
        correctAnswers = item.translations?.it?.split(',').map(s => s.trim().toLowerCase()) || [item.content];
        break;
      case 'definition':
        prompt = item.definition;
        correctAnswers = [item.content.toLowerCase()];
        break;
      default:
        prompt = item.content;
        correctAnswers = [item.content.toLowerCase()];
    }
    
    return {
      item,
      type,
      prompt,
      correctAnswers,
      userAnswer: '',
      isCorrect: null,
      feedback: ''
    };
  }

  async checkAnswer() {
    if (!this.userAnswer.trim()) return;
    
    this.isChecking.set(true);
    const exercise = this.currentExercise();
    if (!exercise) return;
    
    // Update exercise with user's answer
    const userAnswerNormalized = this.userAnswer.trim().toLowerCase();
    exercise.userAnswer = this.userAnswer.trim();
    
    // Check if correct (flexible matching)
    const isCorrect = exercise.correctAnswers.some(correct => 
      this.fuzzyMatch(userAnswerNormalized, correct)
    );
    
    exercise.isCorrect = isCorrect;
    
    // Update SM-2 progress
    const quality = isCorrect ? 4 : 1; // 4 = good, 1 = wrong
    await this.scheduler.updateProgress(exercise.item.id, quality);
    
    // Update exercises signal to trigger re-render
    this.exercises.update(exercises => [...exercises]);
    this.isChecking.set(false);
  }

  private fuzzyMatch(input: string, correct: string): boolean {
    // Exact match
    if (input === correct) return true;
    
    // Remove common articles and prepositions for comparison
    const cleanInput = input.replace(/^(to |a |an |the )/i, '');
    const cleanCorrect = correct.replace(/^(to |a |an |the )/i, '');
    if (cleanInput === cleanCorrect) return true;
    
    // Allow small typos (Levenshtein distance <= 1 for short words, <= 2 for longer)
    const maxDistance = correct.length <= 5 ? 1 : 2;
    if (this.levenshteinDistance(input, correct) <= maxDistance) return true;
    
    return false;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }

  nextExercise() {
    this.userAnswer = '';
    this.currentIndex.update(i => i + 1);
  }

  async restartSession() {
    this.currentIndex.set(0);
    await this.loadExercises();
  }

  exitSession() {
    this.router.navigate(['/dashboard']);
  }
}
