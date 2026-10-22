'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, setAuthUser, logout } from '@/lib/store';
import { authApi } from '@/services/api';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      // 1. If user is already loaded in memory, render immediately
      const existingUser = getCurrentUser();
      if (existingUser) {
        if (existingUser.mustChangePassword) {
          router.push('/change-password');
          return;
        }
        if (isMounted) setIsChecking(false);
        return;
      }

      // 2. Otherwise verify session token against Neon DB via /api/auth/me
      try {
        const res = await authApi.me();
        if (res.success && res.user) {
          setAuthUser(res.user);
          if (res.user.mustChangePassword) {
            router.push('/change-password');
            return;
          }
          if (isMounted) setIsChecking(false);
          return;
        }
      } catch (err) {
        // Token invalid, expired, or absent
      }

      // 3. Unauthorized: wipe session and redirect to login
      logout();
      if (isMounted) {
        router.push('/login');
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" suppressHydrationWarning>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" suppressHydrationWarning></div>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Securing session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export { AuthGuard };
