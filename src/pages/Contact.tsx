import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import OptimizedImage from "@/components/common/OptimizedImage";
import { useSiteContent, useContactInfo } from "@/providers/SiteContentProvider";
import { buildWhatsAppUrl, buildMapEmbedUrl } from "@/domains/cms/constants";
import { inquiryService } from "@/domains/cms/services";

const inputCls = "w-full border border-gold/30 bg-white text-foreground font-sans font-light text-sm px-4 py-3 focus:outline-none focus:border-gold/70 transition-colors placeholder:text-muted-foreground";
const selectCls = "w-full border border-gold/30 bg-white text-foreground font-sans font-light text-sm px-4 py-3 focus:outline-none focus:border-gold/70 transition-colors";
const labelCls = "section-label text-gold/80 block mb-1";

export default function Contact() {
  const { getSlotImage } = useSiteContent();
  // Phase A Task 8: every phone/email/address/social value below resolves from the CMS.
  const contact = useContactInfo();
  const heroImage = getSlotImage(
    "contact",
    "contact_hero",
    "/images/floral_stage.webp",
    "Contact Alankaran"
  ).url;

  const [form, setForm] = useState({
    name: "", phone: "", email: "", weddingDate: "",
    eventType: "", guestCount: "", location: "", budget: "", message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid phone number";
    if (!form.email.includes("@")) e.email = "Enter a valid email address";
    if (!form.weddingDate) e.weddingDate = "Please select a date";
    if (!form.eventType) e.eventType = "Please select an event type";
    if (!form.guestCount) e.guestCount = "Please select guest count";
    if (!form.location.trim() || form.location.trim().length < 2) e.location = "Please enter a location";
    if (!form.budget) e.budget = "Please select a budget range";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting(true);

    // Phase A Task 7: the inquiry is persisted to `cmsInquiries` before we claim success. The success
    // toast used to fire unconditionally while the lead was discarded.
    try {
      await inquiryService.submit({
        name: form.name,
        phone: form.phone,
        email: form.email,
        eventType: form.eventType,
        message: form.message,
        eventDate: form.weddingDate,
        guestCount: form.guestCount,
        location: form.location,
        budget: form.budget,
        sourcePage: "contact",
      });
      setToast(true);
      setForm({ name: "", phone: "", email: "", weddingDate: "", eventType: "", guestCount: "", location: "", budget: "", message: "" });
      setTimeout(() => setToast(false), 4000);
    } catch (err: any) {
      setSubmitError(
        err?.message || "We couldn't send your inquiry. Please try again, or reach us on WhatsApp."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => { const n = { ...er }; delete n[key]; return n; });
  };

  return (
    <div className="bg-background text-foreground">
      <SEO
        title="Contact Us & Inquiries"
        description="Begin your luxury wedding journey with Alankaran. Contact our studios to start planning your celebration."
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <m.div
            className="fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-white border border-green-300 shadow-lg rounded-xl px-5 py-4"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.35 }}
          >
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Check size={16} className="text-green-600" />
            </div>
            <div>
              <p className="font-sans font-semibold text-sm text-foreground">Inquiry Submitted!</p>
              <p className="font-sans text-xs text-muted-foreground font-light">We'll be in touch within 24 hours.</p>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative h-[55vh] flex items-end pb-20 overflow-hidden">
        <OptimizedImage fill priority src={heroImage} alt="Contact Alankaran" sizes="100vw" widths={[640, 828, 1200, 1600, 1920]} className="z-0" style={{ filter: "brightness(0.85) saturate(1.0)" }} />
        <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.4) 100%)" }} />
        <div className="relative max-w-screen-xl mx-auto px-6 lg:px-12 z-20">
          <m.p className="section-label mb-4 text-gold" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Get in Touch</m.p>
          <m.h1 className="text-display text-5xl lg:text-8xl text-white" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 1 }}>
            Begin Your <em className="not-italic text-gold-gradient">Story</em>
          </m.h1>
          <m.p className="text-body mt-4 text-sm text-white/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            Every great celebration begins with a single conversation.
          </m.p>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

          {/* Form */}
          <div className="lg:col-span-2">
            <p className="section-label mb-8 text-gold">Inquiry Form</p>
            <form onSubmit={handleSubmit} className="space-y-6" noValidate data-testid="contact-form">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input value={form.name} onChange={set("name")} className={inputCls} placeholder="Your full name" data-testid="input-name" />
                  {errors.name && <p className="text-red-500 text-xs mt-1 font-sans">{errors.name}</p>}
                </div>
                <div>
                  <label className={labelCls}>Phone Number *</label>
                  <input value={form.phone} onChange={set("phone")} className={inputCls} placeholder="+91 98765 43210" data-testid="input-phone" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1 font-sans">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className={labelCls}>Email Address *</label>
                <input type="email" value={form.email} onChange={set("email")} className={inputCls} placeholder="your@email.com" data-testid="input-email" />
                {errors.email && <p className="text-red-500 text-xs mt-1 font-sans">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Wedding Date *</label>
                  <input type="date" value={form.weddingDate} onChange={set("weddingDate")} className={inputCls} style={{ colorScheme: "light" }} data-testid="input-wedding-date" />
                  {errors.weddingDate && <p className="text-red-500 text-xs mt-1 font-sans">{errors.weddingDate}</p>}
                </div>
                <div>
                  <label className={labelCls}>Event Type *</label>
                  <select value={form.eventType} onChange={set("eventType")} className={selectCls} data-testid="select-event-type">
                    <option value="">Select event type</option>
                    {["Wedding Ceremony", "Reception", "Engagement", "Mehendi", "Sangeet", "Full Wedding Package"].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.eventType && <p className="text-red-500 text-xs mt-1 font-sans">{errors.eventType}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Guest Count *</label>
                  <select value={form.guestCount} onChange={set("guestCount")} className={selectCls} data-testid="select-guest-count">
                    <option value="">Number of guests</option>
                    {["Under 100", "100–300", "300–500", "500–1000", "1000+"].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.guestCount && <p className="text-red-500 text-xs mt-1 font-sans">{errors.guestCount}</p>}
                </div>
                <div>
                  <label className={labelCls}>Preferred Location *</label>
                  <input value={form.location} onChange={set("location")} className={inputCls} placeholder="City or venue" data-testid="input-location" />
                  {errors.location && <p className="text-red-500 text-xs mt-1 font-sans">{errors.location}</p>}
                </div>
              </div>

              <div>
                <label className={labelCls}>Budget Range *</label>
                <select value={form.budget} onChange={set("budget")} className={selectCls} data-testid="select-budget">
                  <option value="">Select your budget</option>
                  {["Under ₹5L", "₹5–10L", "₹10–25L", "₹25–50L", "₹50L–1Cr", "Above ₹1Cr"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                {errors.budget && <p className="text-red-500 text-xs mt-1 font-sans">{errors.budget}</p>}
              </div>

              <div>
                <label className="section-label text-gold mb-1 block">Special Message</label>
                <textarea
                  value={form.message}
                  onChange={set("message")}
                  rows={5}
                  className={`${inputCls} resize-none`}
                  placeholder="Tell us about your dream celebration..."
                  data-testid="input-message"
                />
              </div>

              {submitError && (
                <p className="text-red-500 text-xs font-sans" data-testid="inquiry-error">
                  {submitError}
                </p>
              )}

              <m.button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gold text-background section-label hover:bg-gold/90 hover:gold-glow transition-all flex items-center justify-center disabled:opacity-60"
                whileHover={{ scale: submitting ? 1 : 1.01 }}
                whileTap={{ scale: submitting ? 1 : 0.99 }}
                data-testid="btn-submit-inquiry"
              >
                {submitting ? "Sending..." : "Submit"}
              </m.button>
            </form>
          </div>

          {/* Sidebar */}
          <div>
            <p className="section-label mb-8 text-gold">Contact Information</p>
            <div className="space-y-6">
              <div>
                <p className="section-label mb-1 text-gold/80">Email</p>
                {contact.emails.map((email) => (
                  <p key={email} className="text-body text-sm text-foreground">{email}</p>
                ))}
                <div className="h-px mt-4 bg-gold/20" />
              </div>
              <div>
                <p className="section-label mb-1 text-gold/80">Phone</p>
                {contact.phones.map((phone) => (
                  <p key={phone} className="text-body text-sm text-foreground">{phone}</p>
                ))}
                <div className="h-px mt-4 bg-gold/20" />
              </div>
              <div>
                <p className="section-label mb-1 text-gold/80">Address</p>
                <p className="text-body text-sm text-foreground">{contact.addressLine}</p>
                <div className="h-px mt-4 bg-gold/20" />
              </div>
              <div>
                <p className="section-label mb-1 text-gold/80">Working Hours</p>
                <p className="text-body text-sm text-foreground">{contact.businessHours}</p>
                <div className="h-px mt-4 bg-gold/20" />
              </div>

              <a
                href={buildWhatsAppUrl(contact)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full font-sans text-xs section-label px-4 py-3 bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 transition-colors"
                data-testid="link-whatsapp-contact"
              >
                💬 Chat on WhatsApp
              </a>

              <div className="flex gap-4 pt-2">
                <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer" className="section-label text-xs hover:text-gold transition-colors text-muted-foreground">Instagram</a>
                <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="section-label text-xs hover:text-gold transition-colors text-muted-foreground">Facebook</a>
              </div>

              <div className="pt-2">
                <p className="section-label mb-4">Our Studios</p>
                {contact.studios.map((studio) => (
                  <p key={studio} className="text-body text-sm text-foreground">{studio}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Google Maps */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 pb-20">
        <div className="h-px mb-12 bg-gold/20" />
        <p className="section-label mb-4 text-gold">Find Us</p>
        <h3 className="text-display text-2xl lg:text-3xl mb-6 text-foreground">Our Hyderabad Headquarters</h3>
        <div className="w-full overflow-hidden border border-gold/30" style={{ height: "440px" }} data-testid="map-embed">
          <iframe
            title="Alankaran Hyderabad Headquarters"
            src={buildMapEmbedUrl(contact)}
            width="100%"
            height="100%"
            style={{ border: 0, display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <p className="font-sans text-xs font-light text-muted-foreground mt-3">
          {contact.addressLine}
        </p>
      </div>

      <Footer />
    </div>
  );
}
