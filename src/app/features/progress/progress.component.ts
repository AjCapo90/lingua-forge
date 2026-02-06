import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="progress-container">
      <mat-card class="progress-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>insights</mat-icon>
            Progress
          </mat-card-title>
          <mat-card-subtitle>Track your learning journey</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Detailed progress analytics and charts coming soon...</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button routerLink="/dashboard">
            <mat-icon>arrow_back</mat-icon>
            Back to Dashboard
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .progress-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: #f5f5f5;
    }
    .progress-card {
      max-width: 500px;
      width: 100%;
    }
    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class ProgressComponent {}
