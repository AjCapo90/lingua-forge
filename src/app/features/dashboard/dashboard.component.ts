import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { SupabaseService } from '../../core/services/supabase.service';
import { SchedulerService } from '../../core/services/scheduler.service';

interface UserStats {
  streak: number;
  xp: number;
  itemsDue: number;
  masteredItems: number;
  level: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <mat-toolbar color="primary" class="header">
        <mat-icon class="logo-icon">school</mat-icon>
        <span class="logo-text">LinguaForge</span>
        <span class="spacer"></span>
        
        <button mat-icon-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item routerLink="/settings">
            <mat-icon>settings</mat-icon>
            <span>Settings</span>
          </button>
          <button mat-menu-item (click)="onLogout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </mat-toolbar>
      
      <!-- Main Content -->
      <div class="content">
        <!-- Welcome & Stats -->
        <div class="welcome-section">
          <h1>Welcome back! 👋</h1>
          <p class="subtitle">Ready to practice your English?</p>
        </div>
        
        <!-- Quick Stats -->
        <div class="stats-grid">
          <mat-card class="stat-card streak">
            <mat-icon>local_fire_department</mat-icon>
            <div class="stat-value">{{ stats().streak }}</div>
            <div class="stat-label">Day Streak</div>
          </mat-card>
          
          <mat-card class="stat-card xp">
            <mat-icon>stars</mat-icon>
            <div class="stat-value">{{ stats().xp }}</div>
            <div class="stat-label">Total XP</div>
          </mat-card>
          
          <mat-card class="stat-card due">
            <mat-icon>schedule</mat-icon>
            <div class="stat-value">{{ stats().itemsDue }}</div>
            <div class="stat-label">Items Due</div>
          </mat-card>
          
          <mat-card class="stat-card mastered">
            <mat-icon>verified</mat-icon>
            <div class="stat-value">{{ stats().masteredItems }}</div>
            <div class="stat-label">Mastered</div>
          </mat-card>
        </div>
        
        <!-- Quick Start -->
        <mat-card class="quick-start-card">
          <mat-card-header>
            <mat-card-title>Start Learning</mat-card-title>
            <mat-card-subtitle>Choose your activity</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="activity-grid">
              <button mat-raised-button color="primary" class="activity-btn" 
                      (click)="startStudySession()">
                <mat-icon>school</mat-icon>
                <span>Study Session</span>
                <small>20 min mixed practice</small>
              </button>
              
              <button mat-raised-button class="activity-btn" 
                      routerLink="/flashcards">
                <mat-icon>style</mat-icon>
                <span>Flashcards</span>
                <small>Review vocabulary</small>
              </button>
              
              <button mat-raised-button class="activity-btn"
                      (click)="startSpeaking()">
                <mat-icon>mic</mat-icon>
                <span>Speaking</span>
                <small>Voice practice</small>
              </button>
              
              <button mat-raised-button class="activity-btn"
                      (click)="startListening()">
                <mat-icon>headphones</mat-icon>
                <span>Listening</span>
                <small>Audio exercises</small>
              </button>
            </div>
          </mat-card-content>
        </mat-card>
        
        <!-- Usage Debt Alert -->
        @if (usageDebt().length > 0) {
          <mat-card class="usage-debt-card">
            <mat-card-header>
              <mat-icon class="warning-icon">warning</mat-icon>
              <mat-card-title>Usage Debt</mat-card-title>
              <mat-card-subtitle>Items you've studied but never used</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="debt-items">
                @for (item of usageDebt().slice(0, 5); track item.id) {
                  <mat-chip>{{ item.content }}</mat-chip>
                }
                @if (usageDebt().length > 5) {
                  <mat-chip>+{{ usageDebt().length - 5 }} more</mat-chip>
                }
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary" (click)="practiceDebtItems()">
                Practice These
              </button>
            </mat-card-actions>
          </mat-card>
        }
        
        <!-- Level Progress -->
        <mat-card class="level-card">
          <mat-card-header>
            <mat-card-title>Your Level: {{ stats().level }}</mat-card-title>
            <mat-card-subtitle>Progress to next level</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-progress-bar mode="determinate" [value]="levelProgress()">
            </mat-progress-bar>
            <p class="progress-text">{{ levelProgress() }}% to B2</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: #f5f5f5;
    }
    
    .header {
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .logo-icon {
      margin-right: 8px;
    }
    
    .logo-text {
      font-weight: 500;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .content {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    
    .welcome-section {
      margin-bottom: 24px;
    }
    
    .welcome-section h1 {
      font-size: 28px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .subtitle {
      color: #666;
      font-size: 16px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    @media (min-width: 600px) {
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    
    .stat-card {
      text-align: center;
      padding: 16px;
    }
    
    .stat-card mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-bottom: 8px;
    }
    
    .stat-card.streak mat-icon { color: #ff9800; }
    .stat-card.xp mat-icon { color: #9c27b0; }
    .stat-card.due mat-icon { color: #2196f3; }
    .stat-card.mastered mat-icon { color: #4caf50; }
    
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
    }
    
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    
    .quick-start-card {
      margin-bottom: 24px;
    }
    
    .activity-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .activity-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
      height: auto;
      line-height: 1.4;
    }
    
    .activity-btn mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-bottom: 8px;
    }
    
    .activity-btn span {
      font-weight: 500;
    }
    
    .activity-btn small {
      font-size: 11px;
      opacity: 0.7;
      margin-top: 4px;
    }
    
    .usage-debt-card {
      margin-bottom: 24px;
      border-left: 4px solid #ff9800;
    }
    
    .warning-icon {
      color: #ff9800;
      margin-right: 8px;
    }
    
    .debt-items {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .level-card mat-progress-bar {
      margin-bottom: 8px;
    }
    
    .progress-text {
      text-align: center;
      font-size: 14px;
      color: #666;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private scheduler = inject(SchedulerService);
  private router = inject(Router);
  
  stats = signal<UserStats>({
    streak: 0,
    xp: 0,
    itemsDue: 0,
    masteredItems: 0,
    level: 'B1'
  });
  
  usageDebt = signal<any[]>([]);
  levelProgress = signal(45);

  async ngOnInit() {
    await this.loadStats();
  }

  async loadStats() {
    try {
      const profile = await this.supabase.getUserProfile();
      if (profile) {
        this.stats.set({
          streak: profile.streak_current || 0,
          xp: profile.xp_total || 0,
          itemsDue: 0, // Will be calculated
          masteredItems: 0, // Will be calculated
          level: profile.current_level || 'B1'
        });
      }
      
      // Get items due for review
      const dueItems = await this.supabase.getItemsDueForReview();
      this.stats.update(s => ({ ...s, itemsDue: dueItems.length }));
      
      // Get usage debt items
      const sessionItems = await this.scheduler.getSessionItems('en', 20);
      this.usageDebt.set(sessionItems.integrationItems.map(i => i.item || i));
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }

  startStudySession() {
    this.router.navigate(['/study']);
  }

  startSpeaking() {
    this.router.navigate(['/study'], { queryParams: { mode: 'speaking' } });
  }

  startListening() {
    this.router.navigate(['/study'], { queryParams: { mode: 'listening' } });
  }

  practiceDebtItems() {
    this.router.navigate(['/study'], { queryParams: { mode: 'debt' } });
  }

  async onLogout() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}
