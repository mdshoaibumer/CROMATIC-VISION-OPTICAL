"use client";

import Link from "next/link";

import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { FadeInSection } from "@/components/ui/animations";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Eye Test CTA */}
          <FadeInSection>
            <div className="relative overflow-hidden rounded-4xl bg-neutral-900 p-8 lg:p-12 h-full min-h-90 flex flex-col justify-between group">
              {/* Premium gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
              <div className="absolute top-0 right-0 w-80 h-80 bg-linear-to-bl from-amber-500/10 to-transparent rounded-full -translate-y-1/4 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/5 rounded-full translate-y-1/4 -translate-x-1/4 blur-2xl" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Calendar className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3 font-(family-name:--font-playfair)">
                  Free Eye Test
                </h3>
                <p className="text-neutral-400 max-w-sm leading-relaxed">
                  Comprehensive eye examination by certified optometrists.
                  State-of-the-art equipment. No obligation to purchase.
                </p>
              </div>

              <div className="relative z-10 mt-8">
                <Button variant="primary" size="lg" asChild>
                  <Link href="/eye-test">
                    Book Appointment
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </FadeInSection>

          {/* Store Locator CTA */}
          <FadeInSection delay={0.15}>
            <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-amber-50/80 to-orange-50/40 border border-amber-100/60 p-8 lg:p-12 h-full min-h-90 flex flex-col justify-between group">
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-linear-to-tl from-amber-100/40 to-transparent rounded-full translate-y-1/4 translate-x-1/4" />

              <div className="relative z-10">
                <div className="w-14 h-14 bg-amber-100 border border-amber-200/50 rounded-2xl flex items-center justify-center mb-6">
                  <MapPin className="w-6 h-6 text-amber-700" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-3 font-(family-name:--font-playfair)">
                  Visit Our Stores
                </h3>
                <p className="text-neutral-600 max-w-sm leading-relaxed">
                  50+ premium stores across India. Try on frames, get expert advice,
                  and experience the Cromatic difference in person.
                </p>
              </div>

              <div className="relative z-10 mt-8">
                <Button variant="default" size="lg" asChild>
                  <Link href="/store-locator">
                    Find Nearest Store
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </section>
  );
}
