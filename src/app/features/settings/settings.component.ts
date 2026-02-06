import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatToolbarModule,
    RouterLink
  ],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button routerLink="/dashboard">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <span>Settings</span>
    </mat-toolbar>
    
    <div class="settings-container">
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>Language Settings</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Target Language</mat-label>
            <mat-select [(ngModel)]="targetLanguage">
              <mat-option value="en">English</mat-option>
              <mat-option value="de" disabled>German (Coming soon)</mat-option>
              <mat-option value="fr" disabled>French (Coming soon)</mat-option>
            </mat-select>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Current Level</mat-label>
            <mat-select [(ngModel)]="currentLevel">
              <mat-option value="A1">A1 - Beginner</mat-option>
              <mat-option value="A2">A2 - Elementary</mat-option>
              <mat-option value="B1">B1 - Intermediate</mat-option>
              <mat-option value="B2">B2 - Upper Intermediate</mat-option>
              <mat-option value="C1">C1 - Advanced</mat-option>
              <mat-option value="C2">C2 - Proficient</mat-option>
            </mat-select>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Daily Goal (minutes)</mat-label>
            <mat-select [(ngModel)]="dailyGoal">
              <mat-option [value]="10">10 minutes</mat-option>
              <mat-option [value]="20">20 minutes</mat-option>
              <mat-option [value]="30">30 minutes</mat-option>
              <mat-option [value]="60">60 minutes</mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>
      
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>Voice Settings</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>TTS Voice</mat-label>
            <mat-select [(ngModel)]="ttsVoice">
              <mat-option value="aura-asteria-en">Asteria (US Female)</mat-option>
              <mat-option value="aura-luna-en">Luna (UK Female)</mat-option>
              <mat-option value="aura-orion-en">Orion (US Male)</mat-option>
              <mat-option value="aura-arcas-en">Arcas (US Male Deep)</mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>
      
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>Preferences</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-slide-toggle [(ngModel)]="darkMode">Dark Mode</mat-slide-toggle>
        </mat-card-content>
      </mat-card>
      
      <button mat-raised-button color="primary" class="save-btn" (click)="saveSettings()">
        Save Settings
      </button>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    .settings-card {
      margin-bottom: 16px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }
    .save-btn {
      width: 100%;
    }
    mat-slide-toggle {
      display: block;
      margin-bottom: 16px;
    }
  `]
})
export class SettingsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  
  targetLanguage = 'en';
  currentLevel = 'B1';
  dailyGoal = 20;
  ttsVoice = 'aura-asteria-en';
  darkMode = false;

  async ngOnInit() {
    const profile = await this.supabase.getUserProfile();
    if (profile) {
      this.currentLevel = profile.current_level || 'B1';
      this.dailyGoal = profile.daily_goal_minutes || 20;
      this.targetLanguage = profile.active_target_language || 'en';
    }
  }

  async saveSettings() {
    try {
      await this.supabase.updateUserProfile({
        current_level: this.currentLevel,
        daily_goal_minutes: this.dailyGoal,
        active_target_language: this.targetLanguage
      });
      alert('Settings saved!');
    } catch (e) {
      console.error('Failed to save settings:', e);
      alert('Failed to save settings');
    }
  }
}
