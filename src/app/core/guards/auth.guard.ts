import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Wait for auth to initialize
  if (supabase.isLoading()) {
    // Return a promise that resolves when loading is done
    return new Promise((resolve) => {
      const checkAuth = setInterval(() => {
        if (!supabase.isLoading()) {
          clearInterval(checkAuth);
          if (supabase.currentUser()) {
            resolve(true);
          } else {
            router.navigate(['/login']);
            resolve(false);
          }
        }
      }, 50);
    });
  }

  if (supabase.currentUser()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
