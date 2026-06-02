import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  SlidersHorizontal, 
  ArrowLeft, 
  ShoppingBag, 
  CheckCircle, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Product, Category } from "../types";
import { useCartStore } from "../lib/cartStore";

interface StorefrontProductsProps {
  categories: Category[];
  products: Product[];
  selectedCategoryFilter: number | null;
  setSelectedCategoryFilter: (id: number | null) => void;
  selectedProductSlug: string | null;
  onClearProductSlug: () => void;
  onNavigate: (route: string) => void;
  onSelectProduct: (slug: string) => void;
}

// Extract product specs from actual database fields with sensible fallbacks
export function getProductSpecs(product: Product) {
  const material = product.material || "Acetate";
  const brand = product.brand || "Cromatic Vision";
  const frameType = product.frame_type || "Full Rim";
  const gender = product.gender || "Unisex";

  // Use actual product images from the database
  const galleryImages = product.images && product.images.length > 0
    ? product.images.map(img => img.image_url)
    : [pPrimaryImage(product)];

  // Use sale_price from database if available
  const salePrice = product.sale_price || undefined;

  return { material, brand, frameType, gender, galleryImages, salePrice };
}

function pPrimaryImage(p: Product): string {
  return p.images?.find(i => i.is_primary)?.image_url || "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&auto=format&fit=crop&q=60";
}

export default function StorefrontProducts({
  categories,
  products,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  selectedProductSlug,
  onClearProductSlug,
  onNavigate,
  onSelectProduct
}: StorefrontProductsProps) {
  
  const { addItem } = useCartStore();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedFrameType, setSelectedFrameType] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Product detail image gallery index
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0);
  const [isAddedToast, setIsAddedToast] = useState(false);

  // Active Selected Product Details View
  const activeProduct = useMemo(() => {
    if (!selectedProductSlug) return null;
    return products.find(p => p.slug === selectedProductSlug) || null;
  }, [selectedProductSlug, products]);

  // Handle direct Buy Now
  const handleBuyNow = (p: Product) => {
    addItem(p.id, 1);
    onNavigate("checkout");
  };

  // Filter & Search computation
  const filteredProducts = useMemo(() => {
    let result = [...products].filter(p => p.status === "active");

    // Search Box query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description || "").toLowerCase().includes(q) ||
        (p.category_name || "").toLowerCase().includes(q)
      );
    }

    // Category Filter
    if (selectedCategoryFilter !== null) {
      result = result.filter(p => p.category_id === selectedCategoryFilter);
    }

    // Gender, Material, Brand, FrameType derived filter sets
    result = result.filter(p => {
      const specs = getProductSpecs(p);
      if (selectedGender && specs.gender !== selectedGender) return false;
      if (selectedFrameType && specs.frameType !== selectedFrameType) return false;
      if (selectedMaterial && specs.material !== selectedMaterial) return false;
      if (selectedBrand && specs.brand !== selectedBrand) return false;
      
      // Price categories
      if (priceRange === "under-150" && p.price >= 150) return false;
      if (priceRange === "150-200" && (p.price < 150 || p.price > 200)) return false;
      if (priceRange === "over-200" && p.price <= 200) return false;

      return true;
    });

    // Sorting
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, searchQuery, selectedCategoryFilter, selectedGender, selectedFrameType, selectedMaterial, selectedBrand, priceRange, sortBy]);

  // Page index slice
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Clear filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategoryFilter(null);
    setSelectedGender(null);
    setSelectedFrameType(null);
    setSelectedMaterial(null);
    setSelectedBrand(null);
    setPriceRange(null);
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Related products query (excluding current product, matching categories)
  const relatedProducts = useMemo(() => {
    if (!activeProduct) return [];
    return products.filter(p => p.id !== activeProduct.id && p.category_id === activeProduct.category_id && p.status === "active").slice(0, 3);
  }, [activeProduct, products]);

  // Render Product Details Screen
  if (activeProduct) {
    const specs = getProductSpecs(activeProduct);
    const primaryImg = activeProduct.images?.find(i => i.is_primary)?.image_url || "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&auto=format&fit=crop&q=60";
    
    return (
      <div className="bg-background min-h-[90vh] py-12 px-4 md:px-8 max-w-6xl mx-auto w-full page-enter">
        {/* Back navigation */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onClearProductSlug}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors duration-300 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" /> Back to Collection
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Image Gallery */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-4"
          >
            <div className="relative aspect-square border border-border rounded-xl overflow-hidden bg-secondary group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedGalleryIdx}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  src={specs.galleryImages[selectedGalleryIdx] || primaryImg}
                  alt={activeProduct.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full h-full object-cover select-none"
                />
              </AnimatePresence>
              {activeProduct.stock === 0 && (
                <span className="absolute top-4 left-4 bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg">
                  Sold Out
                </span>
              )}
            </div>

            {/* Gallery thumbnails */}
            <div className="grid grid-cols-3 gap-3">
              {specs.galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedGalleryIdx(idx)}
                  className={`aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                    selectedGalleryIdx === idx ? "border-foreground" : "border-border hover:border-foreground/30"
                  }`}
                >
                  <img src={img} alt="Gallery view" className="w-full h-full object-cover pointer-events-none" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Product Info */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">{specs.brand}</p>
              <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">{activeProduct.name}</h1>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-3">
              {specs.salePrice ? (
                <>
                  <span className="text-2xl font-semibold text-foreground">₹{specs.salePrice.toLocaleString()}</span>
                  <span className="text-lg text-muted-foreground line-through">₹{activeProduct.price.toLocaleString()}</span>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    Save {Math.round((1 - specs.salePrice / activeProduct.price) * 100)}%
                  </span>
                </>
              ) : (
                <span className="text-2xl font-semibold text-foreground">₹{activeProduct.price.toLocaleString()}</span>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeProduct.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {activeProduct.stock > 0 ? `${activeProduct.stock} in stock` : "Out of stock"}
              </span>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-3 py-4 border-y border-border">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Material</p>
                <p className="text-sm font-medium text-foreground">{specs.material}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Frame Type</p>
                <p className="text-sm font-medium text-foreground">{specs.frameType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="text-sm font-medium text-foreground">{specs.gender}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Brand</p>
                <p className="text-sm font-medium text-foreground">{specs.brand}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {activeProduct.description || "Precision-engineered frames designed for exceptional comfort and timeless style. Features premium hinges and lightweight construction."}
              </p>
            </div>

            {/* Toast */}
            {isAddedToast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-3 text-sm text-green-700"
                role="status"
                aria-live="polite"
              >
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>Added to your shopping bag!</span>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => {
                  addItem(activeProduct.id, 1);
                  setIsAddedToast(true);
                  setTimeout(() => setIsAddedToast(false), 3000);
                }}
                disabled={activeProduct.stock === 0}
                className="w-full h-14 bg-foreground text-background font-medium rounded-lg hover:bg-foreground/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px]"
              >
                <ShoppingBag className="w-4 h-4" /> Add to Bag
              </button>
              
              <button
                onClick={() => handleBuyNow(activeProduct)}
                disabled={activeProduct.stock === 0}
                className="w-full h-14 border-2 border-foreground text-foreground font-medium rounded-lg hover:bg-foreground hover:text-background transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-[15px]"
              >
                Buy Now
              </button>
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              {[
                { icon: "🚚", text: "Free shipping" },
                { icon: "↩️", text: "14-day returns" },
                { icon: "🛡️", text: "1-year warranty" },
                { icon: "✓", text: "Authentic product" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.icon}</span> {item.text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 border-t border-border pt-12 space-y-8"
          >
            <h2 className="text-xl md:text-2xl font-light tracking-tight text-foreground">You May Also <span className="font-serif italic">Like</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map(rp => {
                const rpImg = rp.images?.find(i => i.is_primary)?.image_url || "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&auto=format&fit=crop&q=60";
                return (
                  <div
                    key={rp.id}
                    onClick={() => {
                      onSelectProduct(rp.slug);
                      setSelectedGalleryIdx(0);
                    }}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-4/3 rounded-lg overflow-hidden bg-secondary mb-3">
                      <img src={rpImg} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" loading="lazy" />
                    </div>
                    <h4 className="text-sm font-medium text-foreground group-hover:underline underline-offset-2">{rp.name}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">₹{rp.price.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // Render Core Grid Catalog Page
  return (
    <div className="bg-background min-h-[90vh] py-12 px-4 md:px-8 max-w-7xl mx-auto w-full page-enter">
      {/* Header and Filter trigger */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 pb-6 border-b border-border">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">Collection</p>
          <h1 className="text-3xl md:text-4xl font-light tracking-[-0.02em] text-foreground">Our <span className="font-serif italic">Eyewear</span></h1>
          <p className="text-sm text-muted-foreground">Showing {filteredProducts.length} products</p>
        </motion.div>

        {/* Actions bar */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-background border border-border pl-10 pr-4 py-2.5 rounded-lg text-sm text-foreground focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 transition-all duration-200 placeholder:text-muted-foreground/60"
              aria-label="Search products"
            />
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium flex items-center gap-2 cursor-pointer transition-all duration-200 ${
              isSidebarOpen || selectedGender || selectedFrameType || selectedMaterial || selectedBrand || priceRange
                ? "bg-foreground text-background border-foreground"
                : "bg-background border-border text-foreground hover:bg-secondary"
            }`}
            aria-expanded={isSidebarOpen}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-background border border-border px-4 py-2.5 rounded-lg text-sm text-foreground focus:outline-none cursor-pointer"
            aria-label="Sort products"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Filter Sidebar */}
        <AnimatePresence>
          {(isSidebarOpen || selectedGender || selectedFrameType || selectedMaterial || selectedBrand || priceRange) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="lg:col-span-3 space-y-5 lg:border-r lg:border-border lg:pr-6"
              role="region"
              aria-label="Product filters"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Filters</span>
                <button
                  onClick={resetFilters}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  Reset All
                </button>
              </div>

              {/* Category filter */}
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground">Category</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={() => setSelectedCategoryFilter(null)}
                    className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                      selectedCategoryFilter === null ? "bg-foreground text-background font-medium" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                        selectedCategoryFilter === cat.id ? "bg-foreground text-background font-medium" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender filter */}
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground">Gender</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Men", "Women", "Unisex"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedGender(selectedGender === opt ? null : opt)}
                      className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                        selectedGender === opt ? "bg-foreground text-background font-medium" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Type filter */}
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground">Frame Type</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Full Rim", "Semi-Rimless", "Rimless"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedFrameType(selectedFrameType === opt ? null : opt)}
                      className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                        selectedFrameType === opt ? "bg-foreground text-background font-medium" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Material filter */}
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground">Material</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Titanium", "Acetate", "Metal", "Carbon Fiber"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedMaterial(selectedMaterial === opt ? null : opt)}
                      className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                        selectedMaterial === opt ? "bg-foreground text-background font-medium" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand filter */}
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground">Brand</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Ray-Ban", "Oakley", "Gucci", "Prada"].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedBrand(selectedBrand === opt ? null : opt)}
                      className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                        selectedBrand === opt ? "bg-foreground text-background font-medium" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range filter */}
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground">Price Range</p>
                <div className="flex flex-col gap-2 pt-1">
                  {[
                    { value: "under-150", label: "Under ₹150" },
                    { value: "150-200", label: "₹150 - ₹200" },
                    { value: "over-200", label: "Over ₹200" }
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer select-none">
                      <input
                        type="radio"
                        name="priceRange"
                        checked={priceRange === value}
                        onChange={() => setPriceRange(priceRange === value ? null : value)}
                        className="accent-foreground"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className={(isSidebarOpen || selectedGender || selectedFrameType || selectedMaterial || selectedBrand || priceRange) ? "lg:col-span-9 space-y-10" : "lg:col-span-12 space-y-10"}>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 border border-border rounded-xl space-y-4 max-w-md mx-auto">
              <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto" />
              <h3 className="text-base font-medium text-foreground">No products found</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
              <button
                onClick={resetFilters}
                className="mt-2 px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-lg cursor-pointer hover:bg-foreground/90 transition-all duration-200"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((p) => {
                  const specs = getProductSpecs(p);
                  const primaryImg = p.images?.find(img => img.is_primary)?.image_url || "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&auto=format&fit=crop&q=60";
                  
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      onClick={() => onSelectProduct(p.slug)}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-secondary mb-3">
                        <img
                          src={primaryImg}
                          alt={p.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                        />
                        {p.stock === 0 && (
                          <span className="absolute top-3 left-3 bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-2.5 py-1 rounded-md">
                            Sold Out
                          </span>
                        )}
                        {specs.salePrice && (
                          <span className="absolute top-3 right-3 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-2.5 py-1 rounded-md">
                            Sale
                          </span>
                        )}
                        {/* Quick add button */}
                        <div className="absolute bottom-3 left-3 right-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addItem(p.id, 1);
                            }}
                            disabled={p.stock === 0}
                            className="w-full py-2.5 bg-foreground/95 backdrop-blur text-background text-xs font-medium rounded-md hover:bg-foreground transition-colors disabled:opacity-50"
                          >
                            Add to Bag
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">{p.category_name || "Eyewear"}</p>
                          <p className="text-xs text-muted-foreground">{specs.brand}</p>
                        </div>
                        <h3 className="text-sm font-medium text-foreground group-hover:underline underline-offset-2 transition-colors">{p.name}</h3>
                        <div className="flex items-baseline gap-2 pt-0.5">
                          {specs.salePrice ? (
                            <>
                              <span className="text-sm font-semibold text-foreground">₹{specs.salePrice.toLocaleString()}</span>
                              <span className="text-xs text-muted-foreground line-through">₹{p.price.toLocaleString()}</span>
                            </>
                          ) : (
                            <span className="text-sm font-semibold text-foreground">₹{p.price.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                  </button>
                  
                  <span>Page {currentPage} of {totalPages}</span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
