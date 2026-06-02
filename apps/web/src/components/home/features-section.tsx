"use client";

import { Eye, Shield, Award, Clock, Truck, HeadphonesIcon } from "lucide-react";

import { FadeInSection, StaggerContainer, StaggerItem } from "@/components/ui/animations";

const features = [
  {
    icon: Eye,
    title: "Free Eye Testing",
    description: "Professional eye exams with state-of-the-art equipment at all stores",
  },
  {
    icon: Shield,
    title: "1 Year Warranty",
    description: "Complete coverage on all frames and lenses for peace of mind",
  },
  {
    icon: Award,
    title: "Certified Opticians",
    description: "Expert guidance from licensed optometrists for perfect vision",
  },
  {
    icon: Clock,
    title: "Same Day Dispatch",
    description: "Order before 2 PM for same-day processing on in-stock items",
  },
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Complimentary delivery on all orders above ₹999",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "Round-the-clock assistance for any eyewear related queries",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 lg:py-32 bg-neutral-900 text-white relative overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "48px 48px" }} />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/3 rounded-full blur-[128px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-amber-400 tracking-[0.2em] uppercase mb-4">
              Why Choose Us
            </p>
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-5 font-(family-name:--font-playfair)">
              Your Vision, Our Care
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto leading-relaxed">
              Every interaction is designed to deliver the best vision care experience possible.
            </p>
          </div>
        </FadeInSection>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="group p-8 rounded-3xl bg-white/3 backdrop-blur-sm border border-white/6 hover:bg-white/6 hover:border-amber-500/20 transition-all duration-500">
                <div className="w-14 h-14 bg-linear-to-br from-amber-500/20 to-amber-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-amber-500/20">
                  <feature.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2.5 text-white">{feature.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
