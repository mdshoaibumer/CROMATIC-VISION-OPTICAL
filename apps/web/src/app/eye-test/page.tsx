"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Calendar, Clock, MapPin, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/ui/page-hero";

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM",
  "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM",
];

const stores = [
  { id: 1, name: "Cromatic Vision - Indiranagar", address: "100 Ft Road, Indiranagar, Bangalore", distance: "2.1 km" },
  { id: 2, name: "Cromatic Vision - Koramangala", address: "80 Ft Road, Koramangala, Bangalore", distance: "3.5 km" },
  { id: 3, name: "Cromatic Vision - MG Road", address: "MG Road Metro Station, Bangalore", distance: "4.2 km" },
  { id: 4, name: "Cromatic Vision - HSR Layout", address: "Sector 2, HSR Layout, Bangalore", distance: "5.8 km" },
];

export default function EyeTestPage() {
  const [step, setStep] = useState(1);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return {
      day: date.toLocaleDateString("en", { weekday: "short" }),
      date: date.getDate(),
      month: date.toLocaleDateString("en", { month: "short" }),
      full: date.toISOString().split("T")[0],
    };
  });

  return (
    <div className="page-transition">
      <PageHero
        title="Book Your Eye Test"
        description="Comprehensive eye examination by certified optometrists using state-of-the-art equipment. No obligation to purchase."
        breadcrumb="Eye Test"
        gradient="from-blue-900 via-indigo-900 to-neutral-900"
        accentColor="text-blue-400"
        badge="100% Free Eye Test"
      />

      {/* Booking Steps */}
      <section className="py-12 lg:py-16 bg-[#fafafa]">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          {/* Progress Bar */}
          <div className="flex items-center justify-center mb-12">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step >= s ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-500"
                }`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div className={`w-16 sm:w-24 h-1 rounded-full mx-2 transition-all duration-300 ${
                    step > s ? "bg-neutral-900" : "bg-neutral-200"
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mb-8">
            <p className="text-sm text-neutral-500">
              Step {step} of 4: {step === 1 ? "Select Store" : step === 2 ? "Choose Date & Time" : step === 3 ? "Your Details" : "Confirmation"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Select Store */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-neutral-900 mb-6 font-(family-name:--font-playfair)">Select a Store</h2>
                <div className="space-y-3">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => setSelectedStore(store.id)}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
                        selectedStore === store.id
                          ? "border-neutral-900 bg-neutral-50 shadow-premium"
                          : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-neutral-900 mb-1">{store.name}</h3>
                          <p className="text-sm text-neutral-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {store.address}
                          </p>
                        </div>
                        <span className="text-sm text-amber-600 font-medium">{store.distance}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-8 flex justify-end">
                  <Button size="lg" disabled={!selectedStore} onClick={() => setStep(2)}>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Choose Date & Time</h2>

                {/* Date Selection */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Select Date
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                    {dates.map((d) => (
                      <button
                        key={d.full}
                        onClick={() => setSelectedDate(d.full)}
                        className={`p-3 rounded-xl text-center transition-all duration-300 ${
                          selectedDate === d.full
                            ? "bg-neutral-900 text-white shadow-lg"
                            : "bg-white border border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <p className="text-xs opacity-70">{d.day}</p>
                        <p className="text-lg font-bold">{d.date}</p>
                        <p className="text-xs opacity-70">{d.month}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Select Time
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                          selectedTime === time
                            ? "bg-neutral-900 text-white shadow-lg"
                            : "bg-white border border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button size="lg" variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button size="lg" disabled={!selectedDate || !selectedTime} onClick={() => setStep(3)}>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Personal Details */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Your Details</h2>
                <div className="bg-white rounded-2xl p-6 border border-neutral-200 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-700 mb-2 block">Full Name</label>
                      <Input placeholder="Enter your full name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700 mb-2 block">Phone Number</label>
                      <Input type="tel" placeholder="+91 9876543210" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">Email Address</label>
                    <Input type="email" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">Any specific concerns?</label>
                    <textarea
                      className="flex min-h-[100px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 transition-all"
                      placeholder="E.g., headaches, blurry vision, etc."
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <Button size="lg" variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button size="lg" variant="primary" onClick={() => setStep(4)}>
                    Book Appointment
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-neutral-900 mb-3">Appointment Booked!</h2>
                <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                  Your eye test has been scheduled. You&apos;ll receive a confirmation SMS and email shortly.
                </p>
                <div className="bg-neutral-50 rounded-2xl p-6 max-w-sm mx-auto text-left space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-700">Cromatic Vision - Indiranagar</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-700">{selectedDate}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-700">{selectedTime}</span>
                  </div>
                </div>
                <Button asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
