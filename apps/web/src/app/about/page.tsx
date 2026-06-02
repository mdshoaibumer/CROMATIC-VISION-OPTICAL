"use client";

import { motion } from "framer-motion";
import { Eye, Users, Award, Heart, Target, Sparkles } from "lucide-react";
import { FadeInSection, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { PageHero } from "@/components/ui/page-hero";

const stats = [
  { number: "50+", label: "Premium Brands" },
  { number: "100K+", label: "Happy Customers" },
  { number: "50+", label: "Stores Nationwide" },
  { number: "4.9★", label: "Customer Rating" },
];

const values = [
  { icon: Eye, title: "Vision First", description: "Your sight is our priority. Every decision we make centers around delivering the best vision care experience." },
  { icon: Heart, title: "Genuine Care", description: "We treat every customer like family. Personalized attention from certified optometrists at every visit." },
  { icon: Award, title: "Uncompromising Quality", description: "Only the finest materials and lenses. Every frame meets our rigorous quality standards." },
  { icon: Target, title: "Innovation", description: "From AI-powered try-on to precision lens crafting, we embrace technology that serves your vision." },
  { icon: Users, title: "Community", description: "50,000+ eye tests conducted free every year. We believe clear vision should be accessible to all." },
  { icon: Sparkles, title: "Style", description: "Eyewear is an extension of your personality. We curate collections that inspire confidence." },
];

const timeline = [
  { year: "2020", title: "Founded", description: "Started with a mission to make premium eyewear accessible and eye care exceptional." },
  { year: "2021", title: "10 Stores", description: "Expanded to 10 premium stores across 3 cities with full vision care services." },
  { year: "2022", title: "Digital Innovation", description: "Launched virtual try-on, AI recommendations, and home eye test services." },
  { year: "2023", title: "50+ Brands", description: "Partnered with world's leading eyewear brands including Ray-Ban, Tom Ford, and Gucci." },
  { year: "2024", title: "100K Customers", description: "Celebrated serving 100,000 happy customers with a 4.9 star rating." },
  { year: "2026", title: "50+ Stores", description: "Now present in 15+ cities with our premium retail experience." },
];

export default function AboutPage() {
  return (
    <div className="page-transition">
      <PageHero
        title="Redefining the Way India Sees"
        description="Born from a belief that everyone deserves exceptional vision care and premium eyewear, Cromatic Vision Optical is building India's most trusted optical brand."
        breadcrumb="About Us"
        badge="Our Story"
      />

      {/* Stats */}
      <section className="py-16 lg:py-20 bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-3xl lg:text-5xl font-bold text-neutral-900 mb-2 font-(family-name:--font-playfair)">{stat.number}</p>
                <p className="text-sm text-neutral-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 lg:py-28 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <FadeInSection>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <p className="text-xs font-semibold text-amber-600 tracking-[0.2em] uppercase mb-4">Our Mission</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-6 font-(family-name:--font-playfair)">
                Your Vision, Our Care
              </h2>
              <p className="text-lg text-neutral-500 leading-relaxed">
                We exist to provide world-class vision care with premium eyewear in an experience
                that feels personal, modern, and genuinely caring. Every store, every product,
                every interaction is designed to make you see better and feel confident.
              </p>
            </div>
          </FadeInSection>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map((value) => (
              <StaggerItem key={value.title}>
                <div className="hover-card bg-white rounded-3xl p-8 border border-neutral-100/80 h-full">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-5">
                    <value.icon className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">{value.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{value.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold text-amber-600 tracking-[0.2em] uppercase mb-4">Our Journey</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight font-(family-name:--font-playfair)">
                Building Vision, Year by Year
              </h2>
            </div>
          </FadeInSection>

          <div className="space-y-0">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="flex gap-6 pb-12 last:pb-0"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {item.year}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="w-px h-full bg-neutral-200 mt-3" />
                  )}
                </div>
                <div className="pt-2">
                  <h3 className="font-bold text-neutral-900 text-lg mb-1">{item.title}</h3>
                  <p className="text-sm text-neutral-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
