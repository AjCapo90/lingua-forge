import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-placement-test',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="placement-container">
      <mat-card class="placement-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>quiz</mat-icon>
            Placement Test
          </mat-card-title>
          <mat-card-subtitle>Assess your current level</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>The adaptive placement test will determine your CEFR level and identify specific weaknesses.</p>
          <p class="mt-2">Coming soon with 200+ questions across Grammar, Vocabulary, Reading, and Listening.</p>
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
    .placement-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: #f5f5f5;
    }
    .placement-card {
      max-width: 500px;
      width: 100%;
    }
    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mt-2 {
      margin-top: 16px;
    }
  `]
})
export class PlacementTestComponent {}
