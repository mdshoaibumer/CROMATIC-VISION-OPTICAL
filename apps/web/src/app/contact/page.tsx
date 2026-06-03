"use client";

import { useState } from "react";

import { MapPin, Phone, Mail, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeInSection, StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { PageHero } from "@/components/ui/page-hero";

const contactInfo = [
  { icon: Phone, title: "Call Us", details: ["1800-123-4567 (Toll Free)", "Mon - Sun: 9 AM - 9 PM"], action: "tel:18001234567" },
  { icon: Mail, title: "Email Us", details: ["care@cromaticvision.com", "We reply within 24 hours"], action: "mailto:care@cromaticvision.com" },
  { icon: MapPin, title: "Visit Us", details: ["50+ stores across India", "Find your nearest store"], action: "/store-locator" },
  { icon: MessageCircle, title: "Live Chat", details: ["Instant support", "Available 24/7"], action: "#chat" },
];

export default function ContactPage() {
  const [formState, setFormState] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  return (
    <div className="page-transition">
      <PageHero
        title="Get in Touch"
        description="Have questions about our products or services? We're here to help. Reach out and we'll get back to you promptly."
        breadcrumb="Contact"
        badge="We're Here to Help"
      />

      {/* Contact Cards */}
      <section className="py-12 lg:py-16 bg-white border-b border-neutral-100/80">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactInfo.map((item) => (
              <StaggerItem key={item.title}>
                <a href={item.action} className="block group">
                  <div className="hover-card bg-neutral-50 rounded-2xl p-6 text-center h-full border border-neutral-100/80 hover:bg-amber-50 hover:border-amber-200">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                      <item.icon className="w-6 h-6 text-neutral-700 group-hover:text-amber-600 transition-colors" />
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-2">{item.title}</h3>
                    {item.details.map((detail, i) => (
                      <p key={i} className="text-sm text-neutral-500">{detail}</p>
                    ))}
                  </div>
                </a>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 lg:py-20 bg-[#fafafa]">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3 font-(family-name:--font-playfair)">Send Us a Message</h2>
              <p className="text-neutral-500">Fill out the form below and we&apos;ll get back to you within 24 hours.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-neutral-100/80">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">Full Name *</label>
                    <Input placeholder="Your full name" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">Email *</label>
                    <Input type="email" placeholder="you@example.com" value={formState.email} onChange={(e) => setFormState({ ...formState, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">Phone</label>
                    <Input type="tel" placeholder="+91 9876543210" value={formState.phone} onChange={(e) => setFormState({ ...formState, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">Subject *</label>
                    <Input placeholder="What's this about?" value={formState.subject} onChange={(e) => setFormState({ ...formState, subject: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">Message *</label>
                  <textarea
                    rows={5}
                    className="flex min-h-[120px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 transition-all"
                    placeholder="Tell us how we can help..."
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  />
                </div>
                <Button size="lg" variant="primary" className="w-full sm:w-auto">
                  <Send className="w-4 h-4" />
                  Send Message
                </Button>
              </form>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <FadeInSection>
            <h2 className="text-2xl font-bold text-neutral-900 mb-8 text-center font-(family-name:--font-playfair)">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "What are your store hours?", a: "Most of our stores are open from 10:00 AM to 9:00 PM, 7 days a week. Hours may vary by location." },
                { q: "Do you offer free eye tests?", a: "Yes! We offer comprehensive eye tests free of charge at all our stores by certified optometrists." },
                { q: "What is your return policy?", a: "We offer a 14-day no-questions-asked return policy for unused products in original packaging." },
                { q: "Do you ship internationally?", a: "Currently, we ship across India only. International shipping will be available soon." },
                { q: "How long does delivery take?", a: "Standard delivery takes 3-5 business days. Express delivery (1-2 days) is available for select cities." },
              ].map((faq, i) => (
                <div key={i} className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100/80">
                  <h3 className="font-semibold text-neutral-900 mb-2">{faq.q}</h3>
                  <p className="text-sm text-neutral-500">{faq.a}</p>
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
