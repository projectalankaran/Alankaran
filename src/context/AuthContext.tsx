import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import type { User } from "firebase/auth";
import type { AuthContextType } from "@/types";

// Firebase deferral: `authService` (firebase-app + firebase-auth) is loaded lazily so the SDK never
// ships in the public entry chunk. Public visitors are anonymous — `currentUser` stays null until the
// module resolves post-mount, which is exactly the logged-out state the public site already renders.
// `import type { User }` above is erased at build time and carries no runtime cost.
const loadAuthService = () => import("@/services/auth/auth.service").then((m) => m.authService);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Optimized Authentication Context Provider.
 * Enforces memoization via `useCallback` on actions and `useMemo` on context value
 * to guarantee that consuming components only rerender when `currentUser` or `loading` explicitly changes.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Subscribe to Firebase auth state changes once on mount — after the SDK lazily resolves.
    let active = true;
    let unsubscribe = () => {};
    loadAuthService().then((authService) => {
      if (!active) return;
      unsubscribe = authService.onAuthStateChange((user) => {
        setCurrentUser(user);
        setLoading(false);
        // Push identity to the Firestore diagnostics logger. It no longer imports the auth module
        // itself, because doing so booted the whole Firebase Auth stack on public pages.
        import("@/services/firestore/firestoreDiagnostics").then((m) =>
          m.setDiagnosticsUser(user ? { uid: user.uid, email: user.email } : null)
        );
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<User> => {
    const authService = await loadAuthService();
    return await authService.login(email, pass);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const authService = await loadAuthService();
    return await authService.logout();
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      loading,
      isAuthenticated: !!currentUser,
      login,
      logout,
    }),
    [currentUser, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to consume the AuthContext safely from any component.
 * @throws {Error} If called outside of `<AuthProvider>`
 */
/**
 * Anonymous default used when no <AuthProvider> is mounted.
 *
 * Public marketing routes deliberately render without one — initialising Firebase Auth there pulls
 * `firebaseapp.com/__/auth/iframe.js` (95 KB) and a follow-up `googleapis.com/…/getProjectConfig`
 * call, which Lighthouse measured as the single LONGEST critical request chain on `/`
 * (`network-dependency-tree-insight`: document → iframe.js @2,755 ms → getProjectConfig @3,909 ms,
 * both flagged `isLongest`). None of it is needed by a visitor who never signs in.
 *
 * Mirrors the existing `useAnimationCapability` pattern in this codebase: degrade to a conservative
 * value rather than throw, so a component is safe to render inside or outside the provider.
 */
const ANONYMOUS_AUTH: AuthContextType = {
  currentUser: null,
} as AuthContextType;

export function useAuth(): AuthContextType {
  return useContext(AuthContext) ?? ANONYMOUS_AUTH;
}
