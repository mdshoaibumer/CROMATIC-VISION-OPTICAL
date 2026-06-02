"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { FadeInSection } from "@/components/ui/animations";

const testimonials = [
  {
    id: 1,
    name: "Priya Sharma",
    role: "Software Engineer",
    avatar: "PS",
    rating: 5,
    text: "The quality of frames and the attention to detail in the eye test was remarkable. Best eyewear experience I've had. The staff was incredibly knowledgeable and patient.",
    location: "Mumbai",
  },
  {
    id: 2,
    name: "Arjun Mehta",
    role: "Creative Director",
    avatar: "AM",
    rating: 5,
    text: "Finally found a brand that combines premium quality with modern aesthetics. My Cromatic frames get compliments everywhere I go. The virtual try-on feature is a game-changer!",
    location: "Bangalore",
  },
  {
    id: 3,
    name: "Sneha Reddy",
    role: "Doctor",
    avatar: "SR",
    rating: 5,
    text: "As someone who wears glasses 16 hours a day, comfort is everything. These titanium frames are incredibly lightweight yet durable. Worth every penny.",
    location: "Hyderabad",
  },
  {
    id: 4,
    name: "Vikram Singh",
    role: "Entrepreneur",
    avatar: "VS",
    rating: 5,
    text: "The premium collection here rivals international luxury brands at a fraction of the cost. Their blue-light blocking lenses have significantly reduced my eye strain.",
    location: "Delhi",
  },
];

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-24 lg:py-32 bg-[#fafafa] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-amber-600 tracking-[0.2em] uppercase mb-4">
              Customer Stories
            </p>
            <h2 className="text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight font-(family-name:--font-playfair)">
              Loved by 100,000+ Customers
            </h2>
          </div>
        </FadeInSection>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                className="bg-white rounded-4xl p-8 lg:p-14 shadow-premium border border-neutral-100/80"
              >
                <Quote className="w-10 h-10 text-amber-100 mb-8" />

                <p className="text-xl lg:text-2xl text-neutral-700 leading-relaxed mb-10 font-(family-name:--font-playfair) italic">
                  &ldquo;{testimonials[current].text}&rdquo;
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-linear-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-amber-500/20">
                      {testimonials[current].avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {testimonials[current].name}
                      </p>
                      <p className="text-sm text-neutral-400">
                        {testimonials[current].role} • {testimonials[current].location}
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-0.5">
                    {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={prev}
                className="w-11 h-11 rounded-full bg-white border border-neutral-200 flex items-center justify-center hover:border-neutral-300 hover:shadow-sm transition-all duration-300"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      i === current
                        ? "w-8 bg-amber-500"
                        : "w-2 bg-neutral-200 hover:bg-neutral-300"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="w-11 h-11 rounded-full bg-white border border-neutral-200 flex items-center justify-center hover:border-neutral-300 hover:shadow-sm transition-all duration-300"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
