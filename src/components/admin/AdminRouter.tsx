import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminLayout } from "./AdminLayout";
import { AdminLogin, AdminDashboard, AdminImages, AdminDebug, AdminGallery, AdminActivityLog, AdminInquiries, AdminSettings, WeddingStoriesAdmin, PlaceholderPage } from "@/pages/admin";
import { ROUTES } from "@/constants/routes";

export function AdminRouter() {
  const [location, setLocation] = useLocation();

  // Redirect /admin or /admin/ to /admin/dashboard
  useEffect(() => {
    if (location === ROUTES.ADMIN.ROOT || location === `${ROUTES.ADMIN.ROOT}/`) {
      setLocation(ROUTES.ADMIN.DASHBOARD);
    }
  }, [location, setLocation]);

  return (
    <Switch>
      {/* ── Public Auth Route ── */}
      <Route path={ROUTES.ADMIN.LOGIN} component={AdminLogin} />

      {/* ── Protected Dashboard Route ── */}
      <Route
        path={ROUTES.ADMIN.DASHBOARD}
        component={() => (
          <ProtectedRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />

      {/* ── Phase 2 Route: Page Images & Hero Uploader ── */}
      <Route
        path={ROUTES.ADMIN.IMAGES}
        component={() => (
          <ProtectedRoute>
            <AdminLayout>
              <AdminImages />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />

      <Route
        path={ROUTES.ADMIN.GALLERY}
        component={() => (
          <ProtectedRoute>
            <AdminLayout>
              <AdminGallery />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />

      <Route
        path={ROUTES.ADMIN.STORIES}
        component={() => (
          <ProtectedRoute>
            <AdminLayout>
              <WeddingStoriesAdmin />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />

      <Route
        path={ROUTES.ADMIN.SETTINGS}
        component={() => (
          <ProtectedRoute>
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />

      {/* ── Phase 3.5 Route: Enterprise Diagnostics & Health Dashboard ── */}
      <Route
        path={ROUTES.ADMIN.DEBUG}
        component={() => (
          <ProtectedRoute>
            <AdminLayout>
              <AdminDebug />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />

      <Route
        path={ROUTES.ADMIN.INQUIRIES}
        component={() => (
          <ProtectedRoute>
            <AdminLayout>
              <AdminInquiries />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />

      <Route
        path={ROUTES.ADMIN.ACTIVITY}
        component={() => (
          <ProtectedRoute>
            <AdminLayout>
              <AdminActivityLog />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />

      {/* Fallback inside /admin/* to dashboard */}
      <Route
        component={() => (
          <ProtectedRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        )}
      />
    </Switch>
  );
}
