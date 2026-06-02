"use client";

import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Skip to main content link for keyboard/screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-neutral-900 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1" role="main">{children}</main>
      <Footer />
    </>
  );
}
