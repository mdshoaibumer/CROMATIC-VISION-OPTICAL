"use client";

import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
