/**
 * Centralized application route definitions.
 * Prevents hardcoding URL paths in UI components and routing configuration.
 */
export const ROUTES = {
  PUBLIC: {
    HOME: "/",
    ABOUT: "/about",
    SERVICES: "/services",
    DESTINATIONS: "/destinations",
    STORIES: "/wedding-stories",
    GALLERY: "/gallery",
    TESTIMONIALS: "/testimonials",
    CONTACT: "/contact",
  },
  ADMIN: {
    ROOT: "/admin",
    LOGIN: "/admin/login",
    DASHBOARD: "/admin/dashboard",
    IMAGES: "/admin/images",
    DEBUG: "/admin/debug",
    GALLERY: "/admin/gallery",
    STORIES: "/admin/wedding-stories",
    SETTINGS: "/admin/settings",
    INQUIRIES: "/admin/inquiries",
    ACTIVITY: "/admin/activity",
  },
} as const;
