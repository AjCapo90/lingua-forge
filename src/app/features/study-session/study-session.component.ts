import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-study-session',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="study-container">
      <mat-card class="study-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>school</mat-icon>
            Study Session
          </mat-card-title>
          <mat-card-subtitle>Coming soon...</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>The full study session with voice interaction will be available once API keys are configured.</p>
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
    .study-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: #f5f5f5;
    }
    .study-card {
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
export class StudySessionComponent {}
