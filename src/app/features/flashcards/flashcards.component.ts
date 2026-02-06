import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-flashcards',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="flashcards-container">
      <mat-card class="flashcards-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>style</mat-icon>
            Flashcards
          </mat-card-title>
          <mat-card-subtitle>Review your vocabulary</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Flashcard review with SM-2 spaced repetition coming soon...</p>
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
    .flashcards-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: #f5f5f5;
    }
    .flashcards-card {
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
export class FlashcardsComponent {}
