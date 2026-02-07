import { Component, inject, signal, OnInit, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ExerciseService, Exercise, ExerciseResult } from '../../core/services/exercise.service';
import { AIEvaluatorService } from '../../core/services/ai-evaluator.service';
import { SchedulerService } from '../../core/services/scheduler.service';

type SessionPhase = 'setup' | 'exercise' | 'feedback' | 'complete';

@Component({
  selector: 'app-study-session',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatDialogModule,
  ],
  template: `
    <!-- SETUP PHASE -->
    @if (phase() === 'setup') {
      <div class="setup-container">
        <mat-card class="setup-card">
          <mat-card-header>
            <mat-card-title>🎯 Start Session</mat-card-title>
            <mat-card-subtitle>How much time do you have?</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="time-options">
              @for (option of timeOptions; track option.minutes) {
                <button mat-raised-button 
                        [color]="selectedMinutes() === option.minutes ? 'primary' : ''"
                        (click)="selectedMinutes.set(option.minutes)"
                        class="time-button">
                  <span class="time-value">{{ option.minutes }}</span>
                  <span class="time-label">{{ option.label }}</span>
                </button>
              }
            </div>
            
            <div class="session-preview">
              <h3>📋 Session Preview</h3>
              <p>~{{ Math.ceil(selectedMinutes() / 1.5) }} exercises</p>
              <p>Mix of: Speaking 🎤 Writing ✍️ Grammar 📚</p>
              <p>Level: B1/B2</p>
            </div>
          </mat-card-content>
          
          <mat-card-actions align="end">
            <button mat-button (click)="exitSession()">Cancel</button>
            <button mat-raised-button color="primary" (click)="startSession()">
              Start Session
              <mat-icon>play_arrow</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    }

    <!-- EXERCISE PHASE -->
    @if (phase() === 'exercise' || phase() === 'feedback') {
      <mat-toolbar color="primary" class="session-toolbar">
        <button mat-icon-button (click)="confirmExit()">
          <mat-icon>close</mat-icon>
        </button>
        <span class="exercise-type">
          {{ currentExerciseInfo().icon }} {{ currentExerciseInfo().label }}
        </span>
        <span class="spacer"></span>
        <span class="progress-text">{{ currentIndex() + 1 }} / {{ exercises().length }}</span>
        <span class="timer">{{ formatTime(elapsedSeconds()) }}</span>
      </mat-toolbar>
      
      <mat-progress-bar 
        mode="determinate" 
        [value]="progressPercent()"
        [color]="'accent'">
      </mat-progress-bar>
      
      <div class="exercise-container">
        @let exercise = currentExercise();
        @if (exercise) {
          <mat-card class="exercise-card" [style.border-left-color]="currentExerciseInfo().color">
            
            <!-- Exercise Header -->
            <div class="exercise-header">
              <mat-chip-set>
                <mat-chip [style.background]="currentExerciseInfo().color" style="color: white">
                  {{ currentExerciseInfo().icon }} {{ exercise.category }}
                </mat-chip>
                @for (item of exercise.items; track item.id) {
                  <mat-chip>{{ item.content }}</mat-chip>
                }
              </mat-chip-set>
            </div>
            
            <!-- Exercise Prompt -->
            <mat-card-content>
              <p class="exercise-prompt">{{ exercise.prompt }}</p>
              
              @if (exercise.items.length > 0 && phase() === 'exercise') {
                <div class="target-items-hint">
                  <span class="hint-label">💡 Use in your answer:</span>
                  @for (item of exercise.items; track item.id) {
                    <span class="target-item">"{{ item.content }}"</span>
                  }
                </div>
              }
              
              <!-- Input Area (Exercise Phase) -->
              @if (phase() === 'exercise') {
                <div class="input-section">
                  <!-- Mode Toggle -->
                  @if (exercise.inputMode === 'both') {
                    <mat-button-toggle-group [(ngModel)]="inputMode" class="mode-toggle">
                      <mat-button-toggle value="write">✍️ Write</mat-button-toggle>
                      <mat-button-toggle value="speak">🎤 Speak</mat-button-toggle>
                    </mat-button-toggle-group>
                  }
                  
                  <!-- Text Input -->
                  @if (inputMode === 'write' || exercise.inputMode === 'write') {
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Your answer</mat-label>
                      <textarea matInput 
                                [(ngModel)]="userAnswer" 
                                rows="4"
                                placeholder="Type your response here..."
                                [disabled]="isSubmitting()"></textarea>
                    </mat-form-field>
                  }
                  
                  <!-- Voice Input (placeholder) -->
                  @if (inputMode === 'speak') {
                    <div class="voice-input">
                      <button mat-fab color="warn" 
                              [class.recording]="isRecording()"
                              (click)="toggleRecording()">
                        <mat-icon>{{ isRecording() ? 'stop' : 'mic' }}</mat-icon>
                      </button>
                      <p class="voice-status">
                        {{ isRecording() ? 'Recording... Click to stop' : 'Click to start speaking' }}
                      </p>
                      @if (userAnswer) {
                        <div class="transcript">
                          <strong>Transcript:</strong> {{ userAnswer }}
                        </div>
                      }
                    </div>
                  }
                  
                  <button mat-raised-button color="primary" 
                          (click)="submitAnswer()"
                          [disabled]="!userAnswer.trim() || isSubmitting()"
                          class="submit-button">
                    {{ isSubmitting() ? 'Evaluating...' : 'Submit Answer' }}
                    <mat-icon>send</mat-icon>
                  </button>
                </div>
              }
              
              <!-- Feedback (Feedback Phase) -->
              @if (phase() === 'feedback' && currentResult()) {
                @let result = currentResult()!;
                <div class="feedback-section">
                  
                  <!-- Scores -->
                  <div class="scores-grid">
                    <div class="score-item">
                      <span class="score-value" [class.good]="result.scores.grammar >= 4">
                        {{ result.scores.grammar }}/5
                      </span>
                      <span class="score-label">Grammar</span>
                    </div>
                    <div class="score-item">
                      <span class="score-value" [class.good]="result.scores.vocabulary >= 4">
                        {{ result.scores.vocabulary }}/5
                      </span>
                      <span class="score-label">Vocabulary</span>
                    </div>
                    <div class="score-item">
                      <span class="score-value" [class.good]="result.scores.naturalness >= 4">
                        {{ result.scores.naturalness }}/5
                      </span>
                      <span class="score-label">Naturalness</span>
                    </div>
                    <div class="score-item">
                      <span class="score-value" [class.good]="result.scores.itemUsage >= 4">
                        {{ result.scores.itemUsage }}/5
                      </span>
                      <span class="score-label">Item Usage</span>
                    </div>
                  </div>
                  
                  <!-- Your Answer -->
                  <div class="your-answer">
                    <strong>Your answer:</strong>
                    <p>{{ result.userResponse }}</p>
                  </div>
                  
                  <!-- Feedback -->
                  <div class="feedback-text">
                    <mat-icon>lightbulb</mat-icon>
                    <p>{{ result.feedback }}</p>
                  </div>
                  
                  <!-- Corrections -->
                  @if (result.corrections.length > 0) {
                    <div class="corrections">
                      <h4>📝 Corrections:</h4>
                      @for (correction of result.corrections; track correction.original) {
                        <div class="correction-item" [class.l1]="correction.isL1Interference">
                          @if (correction.isL1Interference) {
                            <span class="l1-badge">🇮🇹 Italian Pattern</span>
                          }
                          <p>
                            <span class="wrong">{{ correction.original }}</span>
                            → 
                            <span class="right">{{ correction.corrected }}</span>
                          </p>
                          <p class="explanation">{{ correction.explanation }}</p>
                        </div>
                      }
                    </div>
                  }
                  
                  <!-- Missed Opportunities -->
                  @if (result.missedOpportunities.length > 0) {
                    <div class="missed-opportunities">
                      <h4>💡 Missed Opportunities:</h4>
                      @for (missed of result.missedOpportunities; track missed.itemId) {
                        <div class="missed-item">
                          <strong>"{{ missed.content }}"</strong>: {{ missed.suggestion }}
                        </div>
                      }
                    </div>
                  }
                  
                  <!-- XP Earned -->
                  <div class="xp-earned">
                    +{{ result.xpEarned }} XP
                  </div>
                  
                  <button mat-raised-button color="primary" 
                          (click)="nextExercise()"
                          class="next-button">
                    {{ isLastExercise() ? 'Finish Session' : 'Next Exercise' }}
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      </div>
    }

    <!-- COMPLETE PHASE -->
    @if (phase() === 'complete') {
      <div class="complete-container">
        <mat-card class="complete-card">
          <mat-card-header>
            <mat-card-title>🎉 Session Complete!</mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="final-stats">
              <div class="stat-big">
                <span class="stat-value">{{ totalXP() }}</span>
                <span class="stat-label">XP Earned</span>
              </div>
              
              <div class="stats-row">
                <div class="stat">
                  <span class="stat-value">{{ results().length }}</span>
                  <span class="stat-label">Exercises</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ formatTime(elapsedSeconds()) }}</span>
                  <span class="stat-label">Duration</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ averageScore().toFixed(1) }}/5</span>
                  <span class="stat-label">Avg Score</span>
                </div>
              </div>
            </div>
            
            <!-- Items Practiced -->
            <div class="items-summary">
              <h3>📚 Items Practiced</h3>
              <div class="items-grid">
                @for (item of allItemsPracticed(); track item.id) {
                  <mat-chip [class.mastered]="itemMastered(item.id)">
                    {{ itemMastered(item.id) ? '✅' : '🔄' }} {{ item.content }}
                  </mat-chip>
                }
              </div>
            </div>
            
            <!-- Focus Areas -->
            @if (focusAreas().length > 0) {
              <div class="focus-areas">
                <h3>🎯 Focus for next time</h3>
                @for (area of focusAreas(); track area) {
                  <p>• {{ area }}</p>
                }
              </div>
            }
          </mat-card-content>
          
          <mat-card-actions align="center">
            <button mat-raised-button color="primary" (click)="exitSession()">
              Back to Dashboard
            </button>
            <button mat-button (click)="startNewSession()">
              Start New Session
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    /* Setup Phase */
    .setup-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .setup-card {
      max-width: 500px;
      width: 100%;
    }
    
    .time-options {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 24px 0;
    }
    
    .time-button {
      display: flex;
      flex-direction: column;
      padding: 16px 8px;
      height: auto;
    }
    
    .time-value {
      font-size: 24px;
      font-weight: bold;
    }
    
    .time-label {
      font-size: 12px;
      opacity: 0.8;
    }
    
    .session-preview {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
    }
    
    .session-preview h3 {
      margin: 0 0 8px 0;
    }
    
    .session-preview p {
      margin: 4px 0;
      color: #666;
    }
    
    /* Exercise Phase */
    .session-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .exercise-type {
      font-size: 14px;
      margin-left: 8px;
    }
    
    .spacer { flex: 1; }
    
    .progress-text {
      font-size: 14px;
      margin-right: 16px;
    }
    
    .timer {
      font-family: monospace;
      background: rgba(255,255,255,0.2);
      padding: 4px 8px;
      border-radius: 4px;
    }
    
    .exercise-container {
      max-width: 700px;
      margin: 24px auto;
      padding: 0 16px;
    }
    
    .exercise-card {
      border-left: 4px solid #1976d2;
    }
    
    .exercise-header {
      margin-bottom: 16px;
    }
    
    .exercise-prompt {
      font-size: 20px;
      line-height: 1.5;
      margin-bottom: 16px;
    }
    
    .target-items-hint {
      background: #fff3e0;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .hint-label {
      font-weight: 500;
      display: block;
      margin-bottom: 8px;
    }
    
    .target-item {
      display: inline-block;
      background: #ff9800;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      margin: 4px;
      font-weight: 500;
    }
    
    .input-section {
      margin-top: 16px;
    }
    
    .mode-toggle {
      margin-bottom: 16px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .voice-input {
      text-align: center;
      padding: 32px;
    }
    
    .voice-input button.recording {
      animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    .voice-status {
      margin-top: 16px;
      color: #666;
    }
    
    .transcript {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
      text-align: left;
    }
    
    .submit-button {
      width: 100%;
      margin-top: 16px;
      padding: 12px;
    }
    
    /* Feedback Section */
    .feedback-section {
      margin-top: 24px;
    }
    
    .scores-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .score-item {
      text-align: center;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    
    .score-value {
      display: block;
      font-size: 24px;
      font-weight: bold;
      color: #666;
    }
    
    .score-value.good {
      color: #4caf50;
    }
    
    .score-label {
      font-size: 12px;
      color: #999;
    }
    
    .your-answer {
      background: #e3f2fd;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .feedback-text {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      background: #e8f5e9;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .feedback-text mat-icon {
      color: #4caf50;
    }
    
    .corrections {
      background: #fff8e1;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .correction-item {
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #ffe082;
    }
    
    .correction-item.l1 {
      background: #ffebee;
      padding: 8px;
      border-radius: 4px;
    }
    
    .l1-badge {
      display: inline-block;
      background: #f44336;
      color: white;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    
    .wrong {
      color: #f44336;
      text-decoration: line-through;
    }
    
    .right {
      color: #4caf50;
      font-weight: 500;
    }
    
    .explanation {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }
    
    .missed-opportunities {
      background: #e3f2fd;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .missed-item {
      margin: 8px 0;
    }
    
    .xp-earned {
      text-align: center;
      font-size: 32px;
      font-weight: bold;
      color: #ff9800;
      margin: 16px 0;
    }
    
    .next-button {
      width: 100%;
      padding: 12px;
    }
    
    /* Complete Phase */
    .complete-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 16px;
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }
    
    .complete-card {
      max-width: 600px;
      width: 100%;
    }
    
    .final-stats {
      text-align: center;
      margin-bottom: 24px;
    }
    
    .stat-big .stat-value {
      font-size: 64px;
      font-weight: bold;
      color: #ff9800;
    }
    
    .stat-big .stat-label {
      font-size: 18px;
      color: #666;
    }
    
    .stats-row {
      display: flex;
      justify-content: space-around;
      margin-top: 24px;
    }
    
    .stat {
      text-align: center;
    }
    
    .stat .stat-value {
      display: block;
      font-size: 28px;
      font-weight: bold;
      color: #1976d2;
    }
    
    .stat .stat-label {
      font-size: 14px;
      color: #666;
    }
    
    .items-summary, .focus-areas {
      margin-top: 24px;
    }
    
    .items-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    
    .items-grid mat-chip.mastered {
      background: #c8e6c9;
    }
    
    .focus-areas {
      background: #fff3e0;
      padding: 16px;
      border-radius: 8px;
    }
    
    mat-card-actions {
      display: flex;
      gap: 8px;
      justify-content: center;
    }
  `]
})
export class StudySessionComponent implements OnInit, OnDestroy {
  protected Math = Math;
  
  private router = inject(Router);
  private exerciseService = inject(ExerciseService);
  private evaluator = inject(AIEvaluatorService);
  private scheduler = inject(SchedulerService);
  
  // Session State
  phase = signal<SessionPhase>('setup');
  selectedMinutes = signal(20);
  exercises = signal<Exercise[]>([]);
  currentIndex = signal(0);
  results = signal<ExerciseResult[]>([]);
  
  // Input State
  inputMode: 'write' | 'speak' = 'write';
  userAnswer = '';
  isSubmitting = signal(false);
  isRecording = signal(false);
  
  // Timer
  elapsedSeconds = signal(0);
  private timerInterval?: number;
  
  // Computed
  currentExercise = computed(() => this.exercises()[this.currentIndex()] || null);
  currentResult = computed(() => this.results()[this.currentIndex()] || null);
  progressPercent = computed(() => ((this.currentIndex() + 1) / Math.max(1, this.exercises().length)) * 100);
  isLastExercise = computed(() => this.currentIndex() === this.exercises().length - 1);
  
  currentExerciseInfo = computed(() => {
    const exercise = this.currentExercise();
    if (!exercise) return { icon: '📝', label: 'Exercise', description: '', color: '#1976d2' };
    return this.exerciseService.getExerciseInfo(exercise.type);
  });
  
  // Session Complete computed
  totalXP = computed(() => this.results().reduce((sum, r) => sum + r.xpEarned, 0));
  averageScore = computed(() => {
    const allScores = this.results().flatMap(r => [
      r.scores.grammar, r.scores.vocabulary, r.scores.naturalness, r.scores.itemUsage
    ]);
    return allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  });
  
  allItemsPracticed = computed(() => {
    const items = new Map();
    this.exercises().forEach(ex => {
      ex.items.forEach(item => items.set(item.id, item));
    });
    return Array.from(items.values());
  });
  
  focusAreas = computed(() => {
    const areas: string[] = [];
    const corrections = this.results().flatMap(r => r.corrections);
    
    if (corrections.some(c => c.isL1Interference)) {
      areas.push('Watch out for Italian interference patterns');
    }
    
    const avgItemUsage = this.results().reduce((sum, r) => sum + r.scores.itemUsage, 0) / this.results().length;
    if (avgItemUsage < 3) {
      areas.push('Try to use more target expressions in your answers');
    }
    
    return areas;
  });
  
  timeOptions = [
    { minutes: 10, label: 'Quick' },
    { minutes: 20, label: 'Standard' },
    { minutes: 30, label: 'Deep' },
    { minutes: 60, label: 'Intensive' },
  ];

  ngOnInit() {}

  ngOnDestroy() {
    this.stopTimer();
  }

  async startSession() {
    this.phase.set('exercise');
    this.startTimer();
    
    // Generate exercises
    const exercises = await this.exerciseService.generateSession({
      durationMinutes: this.selectedMinutes(),
      userLevel: 'B1',
    });
    
    this.exercises.set(exercises);
  }

  async submitAnswer() {
    if (!this.userAnswer.trim() || this.isSubmitting()) return;
    
    const exercise = this.currentExercise();
    if (!exercise) return;
    
    this.isSubmitting.set(true);
    
    try {
      const result = await this.evaluator.evaluate(
        exercise,
        this.userAnswer,
        this.inputMode === 'speak' ? 'spoken' : 'written'
      );
      
      // Update SM-2 for each item
      for (const item of exercise.items) {
        const quality = result.itemsUsedCorrectly.includes(item.id) ? 4 : 2;
        await this.scheduler.updateProgress(item.id, quality);
      }
      
      // Store result
      this.results.update(r => [...r, result]);
      this.phase.set('feedback');
      
    } catch (error) {
      console.error('Evaluation error:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  nextExercise() {
    this.userAnswer = '';
    this.inputMode = 'write';
    
    if (this.isLastExercise()) {
      this.stopTimer();
      this.phase.set('complete');
    } else {
      this.currentIndex.update(i => i + 1);
      this.phase.set('exercise');
    }
  }

  toggleRecording() {
    // TODO: Implement actual voice recording with Deepgram
    this.isRecording.update(r => !r);
    
    if (this.isRecording()) {
      // Start recording simulation
      setTimeout(() => {
        this.userAnswer = "This is a simulated transcription. Voice recording coming soon!";
        this.isRecording.set(false);
      }, 3000);
    }
  }

  itemMastered(itemId: number): boolean {
    return this.results().some(r => r.itemsUsedCorrectly.includes(itemId));
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private startTimer() {
    this.timerInterval = window.setInterval(() => {
      this.elapsedSeconds.update(s => s + 1);
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  confirmExit() {
    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
      this.exitSession();
    }
  }

  exitSession() {
    this.stopTimer();
    this.router.navigate(['/dashboard']);
  }

  startNewSession() {
    this.phase.set('setup');
    this.exercises.set([]);
    this.results.set([]);
    this.currentIndex.set(0);
    this.elapsedSeconds.set(0);
    this.userAnswer = '';
  }
}
