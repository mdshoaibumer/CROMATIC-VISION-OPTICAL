import { useState } from "react";
import { MapPin, Clock, Phone, Navigation, Search } from "lucide-react";
import { motion } from "framer-motion";
import { PageContainer, SectionHeader, Reveal } from "./storefront/SharedLayout";

interface Store {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  coordinates: { lat: number; lng: number };
  services: string[];
}

const STORES: Store[] = [
  {
    id: 1,
    name: "Cromatic Vision — Connaught Place",
    address: "F-12, Block F, Connaught Place",
    city: "New Delhi",
    phone: "+91 11 4567 8900",
    hours: "10:00 AM – 9:00 PM",
    coordinates: { lat: 28.6315, lng: 77.2167 },
    services: ["Eye Testing", "Virtual Try-On", "Prescription Lenses", "Repairs"],
  },
  {
    id: 2,
    name: "Cromatic Vision — Linking Road",
    address: "205, Linking Road, Bandra West",
    city: "Mumbai",
    phone: "+91 22 6789 1234",
    hours: "10:00 AM – 9:30 PM",
    coordinates: { lat: 19.0596, lng: 72.8295 },
    services: ["Eye Testing", "Contact Lenses", "Prescription Lenses", "Sunglasses Studio"],
  },
  {
    id: 3,
    name: "Cromatic Vision — Brigade Road",
    address: "78, Brigade Road, Ashok Nagar",
    city: "Bangalore",
    phone: "+91 80 4321 5678",
    hours: "10:30 AM – 9:00 PM",
    coordinates: { lat: 12.9716, lng: 77.6070 },
    services: ["Eye Testing", "Virtual Try-On", "Kids Eyewear", "Premium Frames"],
  },
  {
    id: 4,
    name: "Cromatic Vision — Park Street",
    address: "22A, Park Street",
    city: "Kolkata",
    phone: "+91 33 4567 2345",
    hours: "11:00 AM – 8:30 PM",
    coordinates: { lat: 22.5526, lng: 88.3515 },
    services: ["Eye Testing", "Prescription Lenses", "Sunglasses Studio"],
  },
  {
    id: 5,
    name: "Cromatic Vision — Anna Nagar",
    address: "AA Block, 2nd Avenue, Anna Nagar",
    city: "Chennai",
    phone: "+91 44 7890 3456",
    hours: "10:00 AM – 9:00 PM",
    coordinates: { lat: 13.0850, lng: 80.2101 },
    services: ["Eye Testing", "Contact Lenses", "Virtual Try-On", "Repairs"],
  },
];

interface StorefrontStoreLocatorProps {
  onNavigate: (path: string) => void;
}

export default function StorefrontStoreLocator({ onNavigate }: StorefrontStoreLocatorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const filteredStores = STORES.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageContainer>
      <div className="space-y-10">
        {/* Header */}
        <SectionHeader
          label="Store Locator"
          heading="Visit"
          headingItalic="Us"
          description="Find a Cromatic Vision store near you for personalized fitting, eye testing, and expert consultation."
        />

        {/* Search */}
        <Reveal delay={0.1}>
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city or store name..."
              className="w-full h-12 pl-11 pr-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
            />
          </div>
        </Reveal>

        {/* Store list + Map area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Store cards */}
          <div className="lg:col-span-7 space-y-4">
            {filteredStores.length === 0 ? (
              <div className="p-12 text-center bg-card border border-border rounded-xl">
                <p className="text-sm text-muted-foreground">No stores found matching "{searchQuery}"</p>
              </div>
            ) : (
              filteredStores.map((store, i) => (
                <Reveal key={store.id} delay={i * 0.05}>
                  <motion.div
                    onClick={() => setSelectedStore(store)}
                    className={`p-5 bg-card border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedStore?.id === store.id
                        ? "border-foreground/30 shadow-md"
                        : "border-border hover:border-foreground/15"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-medium text-foreground">{store.name}</h3>
                            <p className="text-xs text-muted-foreground">{store.address}, {store.city}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pl-13">
                          {store.services.map((service) => (
                            <span
                              key={service}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-2 pl-13 md:pl-0 text-xs text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {store.hours}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {store.phone}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Reveal>
              ))
            )}
          </div>

          {/* Map placeholder / selected store details */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Map placeholder */}
              <div className="aspect-4/3 bg-secondary relative flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    {selectedStore ? `${selectedStore.city} — ${selectedStore.name.split("—")[1]?.trim()}` : "Select a store to view location"}
                  </p>
                </div>
                {/* Decorative grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
              </div>

              {/* Selected store details */}
              {selectedStore && (
                <div className="p-5 space-y-4 border-t border-border">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-foreground">{selectedStore.name}</h4>
                    <p className="text-xs text-muted-foreground">{selectedStore.address}, {selectedStore.city}</p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedStore.hours}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selectedStore.phone}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <a
                      href={`https://www.google.com/maps?q=${selectedStore.coordinates.lat},${selectedStore.coordinates.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 h-11 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-all inline-flex items-center justify-center gap-2"
                    >
                      <Navigation className="w-4 h-4" /> Get Directions
                    </a>
                    <a
                      href={`tel:${selectedStore.phone.replace(/\s/g, "")}`}
                      className="h-11 px-4 bg-secondary border border-border text-sm font-medium text-foreground rounded-lg hover:bg-secondary/80 transition-colors inline-flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" /> Call
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
