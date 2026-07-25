import React, { createContext, useContext, useState, lazy, Suspense, ReactNode } from "react";

// Lazy: BookingModal pulls the inquiry service (and thus Firebase) — it must not ride the eager
// public bundle. It only mounts once the visitor actually opens the booking flow.
const BookingModal = lazy(() => import("@/components/BookingModal"));

interface BookingOptions {
  eventType?: string;
  message?: string;
}

interface BookingContextType {
  openBookingModal: (options?: BookingOptions) => void;
  closeBookingModal: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [options, setOptions] = useState<BookingOptions | undefined>(undefined);

  const openBookingModal = (opts?: BookingOptions) => {
    setOptions(opts);
    setHasOpened(true);
    setIsOpen(true);
  };
  const closeBookingModal = () => {
    setIsOpen(false);
    setOptions(undefined);
  };

  return (
    <BookingContext.Provider value={{ openBookingModal, closeBookingModal }}>
      {children}
      {hasOpened && (
        <Suspense fallback={null}>
          <BookingModal isOpen={isOpen} onClose={closeBookingModal} options={options} />
        </Suspense>
      )}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
