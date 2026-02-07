import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'voice-test',
    loadComponent: () => import('./features/voice-test/voice-test.component').then(m => m.VoiceTestComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'study',
    loadComponent: () => import('./features/study-session/study-session.component').then(m => m.StudySessionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'flashcards',
    loadComponent: () => import('./features/flashcards/flashcards.component').then(m => m.FlashcardsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'progress',
    loadComponent: () => import('./features/progress/progress.component').then(m => m.ProgressComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'placement-test',
    loadComponent: () => import('./features/placement-test/placement-test.component').then(m => m.PlacementTestComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
