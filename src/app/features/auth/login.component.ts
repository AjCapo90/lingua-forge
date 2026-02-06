import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <div class="logo">
              <mat-icon class="logo-icon">school</mat-icon>
              <span>LinguaForge</span>
            </div>
          </mat-card-title>
          <mat-card-subtitle>AI-Powered Language Learning</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          @if (mode() === 'login') {
            <form (ngSubmit)="onLogin()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" [(ngModel)]="email" name="email" required>
                <mat-icon matSuffix>email</mat-icon>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" 
                       [(ngModel)]="password" name="password" required>
                <button mat-icon-button matSuffix type="button" 
                        (click)="hidePassword.set(!hidePassword())">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>
              
              @if (error()) {
                <p class="error-message">{{ error() }}</p>
              }
              
              <button mat-raised-button color="primary" type="submit" 
                      class="full-width" [disabled]="isLoading()">
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Login
                }
              </button>
            </form>
            
            <mat-divider class="mt-2 mb-2"></mat-divider>
            
            <button mat-stroked-button class="full-width google-btn" 
                    (click)="onGoogleLogin()" [disabled]="isLoading()">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                   alt="Google" class="google-icon">
              Continue with Google
            </button>
            
            <p class="switch-mode mt-2">
              Don't have an account? 
              <a (click)="mode.set('signup')">Sign up</a>
            </p>
          } @else {
            <form (ngSubmit)="onSignup()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" [(ngModel)]="email" name="email" required>
                <mat-icon matSuffix>email</mat-icon>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" 
                       [(ngModel)]="password" name="password" required minlength="6">
                <button mat-icon-button matSuffix type="button" 
                        (click)="hidePassword.set(!hidePassword())">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>
              
              @if (error()) {
                <p class="error-message">{{ error() }}</p>
              }
              
              @if (success()) {
                <p class="success-message">{{ success() }}</p>
              }
              
              <button mat-raised-button color="primary" type="submit" 
                      class="full-width" [disabled]="isLoading()">
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Create Account
                }
              </button>
            </form>
            
            <p class="switch-mode mt-2">
              Already have an account? 
              <a (click)="mode.set('login')">Login</a>
            </p>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
      padding: 16px;
    }
    
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 24px;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 24px;
      font-weight: 500;
    }
    
    .logo-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .error-message {
      color: #f44336;
      font-size: 14px;
      margin-bottom: 16px;
    }
    
    .success-message {
      color: #4caf50;
      font-size: 14px;
      margin-bottom: 16px;
    }
    
    .switch-mode {
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    
    .switch-mode a {
      color: #1976d2;
      cursor: pointer;
      text-decoration: none;
    }
    
    .switch-mode a:hover {
      text-decoration: underline;
    }
    
    .google-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .google-icon {
      width: 20px;
      height: 20px;
    }
    
    mat-card-header {
      margin-bottom: 24px;
    }
    
    mat-spinner {
      display: inline-block;
    }
  `]
})
export class LoginComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  
  mode = signal<'login' | 'signup'>('login');
  email = '';
  password = '';
  hidePassword = signal(true);
  isLoading = signal(false);
  error = signal('');
  success = signal('');

  async onLogin() {
    if (!this.email || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }
    
    this.isLoading.set(true);
    this.error.set('');
    
    try {
      const { error } = await this.supabase.signIn(this.email, this.password);
      if (error) throw error;
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error.set(e.message || 'Login failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSignup() {
    if (!this.email || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }
    
    if (this.password.length < 6) {
      this.error.set('Password must be at least 6 characters');
      return;
    }
    
    this.isLoading.set(true);
    this.error.set('');
    this.success.set('');
    
    try {
      const { error } = await this.supabase.signUp(this.email, this.password);
      if (error) throw error;
      this.success.set('Account created! Please check your email to confirm.');
    } catch (e: any) {
      this.error.set(e.message || 'Signup failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onGoogleLogin() {
    this.isLoading.set(true);
    this.error.set('');
    
    try {
      const { error } = await this.supabase.signInWithGoogle();
      if (error) throw error;
    } catch (e: any) {
      this.error.set(e.message || 'Google login failed');
      this.isLoading.set(false);
    }
  }
}
