"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Navigation, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";

const stores = [
  { id: 1, name: "Cromatic Vision - Indiranagar", address: "100 Ft Road, Indiranagar, Bangalore - 560038", phone: "+91 80 4567 8901", hours: "10:00 AM - 9:00 PM", rating: 4.9, reviews: 234, services: ["Eye Test", "Contact Lens Fitting", "Frame Adjustment"], lat: 12.9784, lng: 77.6408 },
  { id: 2, name: "Cromatic Vision - Koramangala", address: "80 Ft Road, 4th Block, Koramangala, Bangalore - 560034", phone: "+91 80 4567 8902", hours: "10:00 AM - 9:00 PM", rating: 4.8, reviews: 189, services: ["Eye Test", "Virtual Try-On", "Frame Adjustment"], lat: 12.9352, lng: 77.6245 },
  { id: 3, name: "Cromatic Vision - MG Road", address: "Near MG Road Metro, MG Road, Bangalore - 560001", phone: "+91 80 4567 8903", hours: "10:00 AM - 9:30 PM", rating: 4.9, reviews: 312, services: ["Eye Test", "Contact Lens Fitting", "Lens Lab"], lat: 12.9757, lng: 77.6062 },
  { id: 4, name: "Cromatic Vision - Whitefield", address: "Forum Neighbourhood Mall, Whitefield, Bangalore - 560066", phone: "+91 80 4567 8904", hours: "10:30 AM - 9:30 PM", rating: 4.7, reviews: 156, services: ["Eye Test", "Frame Adjustment"], lat: 12.9698, lng: 77.7500 },
  { id: 5, name: "Cromatic Vision - Jayanagar", address: "4th Block, Jayanagar, Bangalore - 560041", phone: "+91 80 4567 8905", hours: "10:00 AM - 9:00 PM", rating: 4.8, reviews: 201, services: ["Eye Test", "Contact Lens Fitting", "Frame Adjustment", "Lens Lab"], lat: 12.9259, lng: 77.5839 },
  { id: 6, name: "Cromatic Vision - Connaught Place", address: "N Block, Connaught Place, New Delhi - 110001", phone: "+91 11 4567 8906", hours: "10:00 AM - 9:00 PM", rating: 4.9, reviews: 445, services: ["Eye Test", "Virtual Try-On", "Contact Lens Fitting", "Lens Lab"], lat: 28.6315, lng: 77.2167 },
];

export default function StoreLocatorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<number | null>(null);

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-transition">
      <PageHero
        title="Find a Store"
        description="Visit one of our 50+ premium stores across India for personalized service and expert care."
        breadcrumb="Store Locator"
        badge="50+ Stores Nationwide"
      />

      {/* Search Bar */}
      <section className="py-8 bg-white border-b border-neutral-100/80">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, area or store name..."
              className="w-full h-14 pl-12 pr-5 rounded-2xl bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-amber-500/20 border border-neutral-200 transition-all duration-300"
            />
          </div>
        </div>
      </section>

      {/* Store List & Map */}
      <section className="py-8 lg:py-12 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Store List */}
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-hide">
              <p className="text-sm text-neutral-400 mb-4">
                {filteredStores.length} stores found
              </p>
              {filteredStores.map((store) => (
                <motion.div
                  key={store.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`hover-card bg-white rounded-2xl p-5 border-2 cursor-pointer ${
                    selectedStore === store.id
                      ? "border-neutral-900 shadow-premium"
                      : "border-neutral-100/80"
                  }`}
                  onClick={() => setSelectedStore(store.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-neutral-900">{store.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium">{store.rating}</span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-neutral-500 flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      {store.address}
                    </p>
                    <p className="text-sm text-neutral-500 flex items-center gap-2">
                      <Phone className="w-4 h-4 shrink-0" />
                      {store.phone}
                    </p>
                    <p className="text-sm text-neutral-500 flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      {store.hours}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {store.services.map((service) => (
                      <span key={service} className="text-xs px-2 py-1 bg-neutral-100 rounded-md text-neutral-600">
                        {service}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button size="sm" variant="default" className="flex-1">
                      <Navigation className="w-3.5 h-3.5" />
                      Get Directions
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Phone className="w-3.5 h-3.5" />
                      Call Store
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden h-[500px] lg:h-[700px] sticky top-24">
              <div className="w-full h-full bg-linear-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-500 font-medium">Interactive Map</p>
                  <p className="text-sm text-neutral-400">Google Maps integration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
