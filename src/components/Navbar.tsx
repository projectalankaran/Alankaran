import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useBooking } from "@/context/BookingContext";
import Logo from "@/components/Logo";
import { prefetchRoute } from "@/utils/routePrefetch";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Luxury Services", href: "/services" },
  { label: "Destinations", href: "/destinations" },
  { label: "Wedding Stories", href: "/wedding-stories" },
  { label: "Gallery", href: "/gallery" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Contact", href: "/contact" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    root.removeAttribute("data-theme");
    localStorage.removeItem("alankaran-theme");
  }, []);

  const { openBookingModal } = useBooking();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; link: string }[]>([]);

  const handleLinkClick = (e: React.MouseEvent<HTMLElement>, href: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x, y, link: href }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 400);
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <nav
        aria-label="Main Navigation"
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/30"
        style={{ boxShadow: "0 10px 30px rgba(43, 36, 32, 0.03)" }}
      >
        <div className="w-full px-6 lg:px-10 xl:px-14 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <m.div
              className="cursor-pointer"
              whileHover={{ opacity: 0.85 }}
              data-testid="logo"
            >
              <Logo size={36} showText={true} />
            </m.div>
          </Link>

          {/* Desktop Nav - Right aligned */}
          <div className="hidden lg:flex items-center justify-end gap-3.5 xl:gap-5 whitespace-nowrap ml-auto">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => prefetchRoute(link.href)}
                  onFocus={() => prefetchRoute(link.href)}
                >
                  <m.span
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="group relative cursor-pointer pb-2 pt-1 px-2.5 text-[9px] xl:text-[9.5px] tracking-[0.06em] xl:tracking-[0.1em] uppercase font-semibold block overflow-hidden rounded-md"
                    animate={{
                      scale: isActive ? 1.05 : 1,
                      color: isActive ? "var(--color-primary)" : "hsl(var(--foreground) / 0.75)"
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      duration: 0.3
                    }}
                    whileHover={{ y: -0.5 }}
                    data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                    {/* Sliding liquid underline ribbon */}
                    {isActive && (
                      <m.span
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 w-full h-[2px] bg-gold"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    
                    {/* Subtle gold dust particles burst on hover */}
                    <span className="absolute inset-0 pointer-events-none overflow-visible opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="absolute left-[20%] bottom-1 w-[2px] h-[2px] rounded-full bg-gold/85 animate-particle-1" />
                      <span className="absolute left-[40%] bottom-1 w-[2px] h-[2px] rounded-full bg-gold/85 animate-particle-2" />
                      <span className="absolute left-[60%] bottom-1 w-[2px] h-[2px] rounded-full bg-gold/85 animate-particle-3" />
                      <span className="absolute left-[80%] bottom-1 w-[2px] h-[2px] rounded-full bg-gold/85 animate-particle-4" />
                    </span>

                    {/* Post-click Gold Ripple effect */}
                    {ripples.filter(r => r.link === link.href).map((ripple) => (
                      <span
                        key={ripple.id}
                        className="absolute bg-gold rounded-full pointer-events-none animate-gold-ripple"
                        style={{
                          left: ripple.x,
                          top: ripple.y,
                          width: "20px",
                          height: "20px",
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    ))}
                  </m.span>
                </Link>
              );
            })}

             {/* Book button */}
            <m.button
              onClick={() => openBookingModal()}
              className="ml-2 px-4.5 py-1.5 bg-gold text-background text-[9px] xl:text-[9.5px] tracking-[0.1em] uppercase font-bold rounded-full hover:bg-[#9B7744] transition-all border border-gold/20 shadow-sm"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              data-testid="btn-nav-book"
            >
              Book
            </m.button>
          </div>

          {/* Hamburger (mobile only) */}
          <m.button
            className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
            whileTap={{ scale: 0.92 }}
            data-testid="btn-hamburger"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </m.button>
        </div>
      </nav>

      {/* Mobile Full-Screen Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <m.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col justify-center items-center bg-background/98"
            initial={{ opacity: 0, clipPath: "circle(0% at top right)" }}
            animate={{ opacity: 1, clipPath: "circle(150% at top right)" }}
            exit={{ opacity: 0, clipPath: "circle(0% at top right)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col items-center gap-8">
              <div className="mb-4">
                <Logo size={48} showText={true} />
              </div>
              {navLinks.map((link, i) => {
                const isActive = location === link.href;
                return (
                  <m.div
                    key={link.href}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.05 * i + 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={link.href}
                      onMouseEnter={() => prefetchRoute(link.href)}
                      onFocus={() => prefetchRoute(link.href)}
                    >
                      <m.span
                        onClick={(e) => handleLinkClick(e, link.href)}
                        className="font-serif text-3xl cursor-pointer block relative overflow-hidden px-6 py-2 rounded-lg"
                        animate={{
                          scale: isActive ? 1.05 : 1,
                          color: isActive ? "var(--color-primary)" : "hsl(var(--foreground) / 0.9)"
                        }}
                        transition={{ duration: 0.3 }}
                        data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {link.label}

                        {/* Sliding liquid underline ribbon for active mobile item */}
                        {isActive && (
                          <m.span
                            layoutId="mobile-tab-indicator"
                            className="absolute bottom-0 left-6 right-6 h-[2px] bg-gold"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}

                        {/* Subtle gold dust particles burst on hover */}
                        <span className="absolute inset-0 pointer-events-none overflow-visible opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-200">
                          <span className="absolute left-[20%] bottom-1 w-[2px] h-[2px] rounded-full bg-gold/85 animate-particle-1" />
                          <span className="absolute left-[40%] bottom-1 w-[2px] h-[2px] rounded-full bg-gold/85 animate-particle-2" />
                          <span className="absolute left-[60%] bottom-1 w-[2px] h-[2px] rounded-full bg-gold/85 animate-particle-3" />
                          <span className="absolute left-[80%] bottom-1 w-[2px] h-[2px] rounded-full bg-gold/85 animate-particle-4" />
                        </span>

                        {/* Post-click Gold Ripple effect */}
                        {ripples.filter(r => r.link === link.href).map((ripple) => (
                          <span
                            key={ripple.id}
                            className="absolute bg-gold rounded-full pointer-events-none animate-gold-ripple"
                            style={{
                              left: ripple.x,
                              top: ripple.y,
                              width: "20px",
                              height: "20px",
                              transform: "translate(-50%, -50%)",
                            }}
                          />
                        ))}
                      </m.span>
                    </Link>
                  </m.div>
                );
              })}



              <m.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.55, duration: 0.5 }}
              >
                <div className="flex flex-col gap-4 mt-4">
                  <Link href="/contact">
                    <button
                      className="w-full px-8 py-3.5 border border-gold text-gold section-label rounded-full hover:bg-gold hover:text-nizami-dark transition-all"
                      data-testid="mobile-btn-consultation"
                    >
                      Book Consultation
                    </button>
                  </Link>
                </div>
              </m.div>
            </div>

            {/* Thin gold divider */}
            <div className="absolute bottom-10 w-16 h-px bg-gold opacity-40" />
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
