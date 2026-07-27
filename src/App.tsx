import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { Suspense, lazy, useState, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { BookingProvider } from "@/context/BookingContext";
import NotFound from "@/pages/not-found";
import PageTransition from "@/components/PageTransition";
import FloatingCTA from "@/components/FloatingCTA";
import { AuthProvider } from "@/context/AuthContext";
import { SiteContentProvider } from "@/providers/SiteContentProvider";
import { AnimationProvider } from "@/providers/AnimationProvider";
import { SiteErrorBoundary } from "@/components/common/SiteErrorBoundary";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

// Admin surface is lazy so its Firebase-heavy pages never ship in the public entry chunk.
const AdminRouter = lazy(() =>
  import("@/components/admin/AdminRouter").then((m) => ({ default: m.AdminRouter }))
);

const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const Services = lazy(() => import("@/pages/Services"));
const DestinationWeddings = lazy(() => import("@/pages/DestinationWeddings"));

const WeddingStories = lazy(() => import("@/pages/WeddingStories"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const Testimonials = lazy(() => import("@/pages/Testimonials"));
const Contact = lazy(() => import("@/pages/Contact"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="font-serif text-3xl tracking-[0.15em] text-gold-gradient">
          ALANKARAN
        </p>
        <div className="h-px w-16 mx-auto mt-4 bg-gold animate-pulse" />
      </div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location}>
        <Switch location={location}>
          <Route path="/" component={() => <Suspense fallback={<PageLoader />}><Home /></Suspense>} />
          <Route path="/about" component={() => <Suspense fallback={<PageLoader />}><About /></Suspense>} />
          <Route path="/services" component={() => <Suspense fallback={<PageLoader />}><Services /></Suspense>} />
          <Route path="/destinations" component={() => <Suspense fallback={<PageLoader />}><DestinationWeddings /></Suspense>} />
          <Route path="/wedding-stories" component={() => <Suspense fallback={<PageLoader />}><WeddingStories /></Suspense>} />
          <Route path="/gallery" component={() => <Suspense fallback={<PageLoader />}><Gallery /></Suspense>} />
          <Route path="/testimonials" component={() => <Suspense fallback={<PageLoader />}><Testimonials /></Suspense>} />
          <Route path="/contact" component={() => <Suspense fallback={<PageLoader />}><Contact /></Suspense>} />
          <Route path="/themes" component={() => {
            const [, setLoc] = useLocation();
            useEffect(() => { setLoc("/#royal-themes"); }, [setLoc]);
            return <PageLoader />;
          }} />
          <Route path="/wedding-themes" component={() => {
            const [, setLoc] = useLocation();
            useEffect(() => { setLoc("/#royal-themes"); }, [setLoc]);
            return <PageLoader />;
          }} />
          <Route component={NotFound} />
        </Switch>
      </PageTransition>
    </AnimatePresence>
  );
}

function MainContent({ showWhatsApp }: { showWhatsApp: boolean }) {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  // Starts false on server AND on the client's first render, so hydration matches; flips only for
  // an already-signed-in admin, after mount.
  const [needsAuth, setNeedsAuth] = useState(false);
  useEffect(() => {
    if (hasPersistedAdminSession()) setNeedsAuth(true);
  }, []);

  // Scope the CMS "cms-theme" palette to the admin area only. Toggling the class
  // on <body> (not a nested div) means Radix modals — which portal to
  // document.body — also inherit the espresso/ivory tokens, while the public
  // marketing site is never touched by them.
  useEffect(() => {
    if (!isAdminRoute) return;
    document.body.classList.add("cms-theme");
    return () => document.body.classList.remove("cms-theme");
  }, [isAdminRoute]);

  if (isAdminRoute) {
    return (
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <AdminRouter />
        </Suspense>
      </AuthProvider>
    );
  }

  const publicTree = (
    <SiteContentProvider>
      <SiteErrorBoundary>
        <ScrollToTop />
        <Navbar />
        <Router />
        <FloatingCTA />
        {showWhatsApp && <WhatsAppButton />}
      </SiteErrorBoundary>
    </SiteContentProvider>
  );

  // Anonymous visitors get NO auth stack at all — see the note on ANONYMOUS_AUTH in AuthContext.
  // A signed-in admin still gets the real provider so CMS Preview Mode keeps working; that is
  // decided after mount (never during the first render) so the server and client render the same
  // tree and hydration stays byte-identical.
  return needsAuth ? <AuthProvider>{publicTree}</AuthProvider> : publicTree;
}

/**
 * True only when this browser already holds a persisted Firebase session — i.e. an admin. Firebase
 * Auth writes `firebase:authUser:<apiKey>:[DEFAULT]` to localStorage, so this is a synchronous,
 * network-free check. Anonymous visitors (including Lighthouse) never match.
 */
function hasPersistedAdminSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("firebase:authUser:")) return true;
    }
  } catch {
    /* storage disabled — treat as anonymous */
  }
  return false;
}

function App({ helmetContext, isServer = false }: { helmetContext?: any, isServer?: boolean }) {
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const activate = () => {
      setShowWhatsApp(true);
      window.removeEventListener("scroll", activate);
      window.removeEventListener("touchstart", activate);
      clearTimeout(timer);
    };
    window.addEventListener("scroll", activate, { once: true, passive: true });
    window.addEventListener("touchstart", activate, { once: true, passive: true });
    timer = setTimeout(activate, 4000);
    return () => {
      window.removeEventListener("scroll", activate);
      window.removeEventListener("touchstart", activate);
      clearTimeout(timer);
    };
  }, []);

  return (
    <HelmetProvider context={helmetContext}>
      <AnimationProvider>
        <BookingProvider>
          <LazyMotion features={domAnimation} strict>
            {isServer ? (
              <MainContent showWhatsApp={showWhatsApp} />
            ) : (
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <MainContent showWhatsApp={showWhatsApp} />
              </WouterRouter>
            )}
          </LazyMotion>
          <Toaster />
        </BookingProvider>
      </AnimationProvider>
    </HelmetProvider>
  );
}

export default App;
