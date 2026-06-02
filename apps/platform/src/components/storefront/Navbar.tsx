"use client";

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ShoppingBag, User, Menu, X, ChevronDown, Heart, MapPin } from "lucide-react"
import { useCartStore } from "../../lib/cartStore"

const navItems = [
  { 
    name: "Eyeglasses", 
    href: "/products?category=eyeglasses",
    hasDropdown: true,
    items: [
      { label: "Men", href: "/products?category=eyeglasses&gender=Men" },
      { label: "Women", href: "/products?category=eyeglasses&gender=Women" },
      { label: "Kids", href: "/products?category=eyeglasses&gender=Kids" },
      { label: "Reading Glasses", href: "/products?category=reading" },
      { label: "Blue Light", href: "/products?category=blue-light" },
    ]
  },
  { 
    name: "Sunglasses", 
    href: "/products?category=sunglasses",
    hasDropdown: true,
    items: [
      { label: "Aviator", href: "/products?category=sunglasses&style=aviator" },
      { label: "Wayfarer", href: "/products?category=sunglasses&style=wayfarer" },
      { label: "Round", href: "/products?category=sunglasses&style=round" },
      { label: "Polarized", href: "/products?category=sunglasses&type=polarized" },
      { label: "Sport", href: "/products?category=sunglasses&type=sport" },
    ]
  },
  { name: "Brands", href: "/products", hasDropdown: false, items: [] },
  { name: "Virtual Try-On", href: "/try-on", hasDropdown: false, items: [] },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { totalCount, fetchCart } = useCartStore()

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isMobileMenuOpen])

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-foreground text-background text-center py-2.5 px-4 text-xs tracking-wide font-medium relative z-50">
        <span>Free shipping on orders above ₹3,000</span>
        <span className="hidden sm:inline mx-3 opacity-30">|</span>
        <span className="hidden sm:inline opacity-80">Easy 14-day returns</span>
      </div>

      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled 
            ? "bg-background/98 backdrop-blur-xl shadow-sm border-b border-border/50" 
            : "bg-background/80 backdrop-blur-sm"
        }`}
        style={{ top: isScrolled ? 0 : "36px" }}
      >
        <nav className="max-w-360 mx-auto px-6 lg:px-10" role="navigation" aria-label="Main navigation">
          <div className="flex items-center justify-between h-18">
            {/* Logo */}
            <Link to="/" className="relative z-10 flex items-center gap-2" aria-label="Cromatic Vision - Home">
              <span className="text-[22px] font-semibold tracking-[-0.03em] text-foreground">
                Cromatic<span className="font-light ml-1">Vision</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    to={item.href}
                    className={`flex items-center gap-1 px-4 py-2 text-[14px] font-medium transition-colors duration-200 rounded-full ${
                      activeDropdown === item.name 
                        ? 'text-foreground bg-secondary' 
                        : 'text-foreground/70 hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {item.name}
                    {item.hasDropdown && (
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        activeDropdown === item.name ? 'rotate-180' : ''
                      }`} />
                    )}
                  </Link>
                  
                  <AnimatePresence>
                    {item.hasDropdown && activeDropdown === item.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-full left-0 mt-2 w-52 bg-background border border-border shadow-xl rounded-xl overflow-hidden"
                      >
                        <div className="py-2">
                          {item.items?.map((subItem) => (
                            <Link
                              key={subItem.label}
                              to={subItem.href}
                              className="block px-4 py-2.5 text-[14px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-150"
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 text-foreground/60 hover:text-foreground hover:bg-secondary/50 rounded-full transition-all duration-200"
                aria-label="Search products"
              >
                <Search className="w-4.5 h-4.5" strokeWidth={1.5} />
              </button>
              
              <Link
                to="/account"
                className="hidden md:flex p-2.5 text-foreground/60 hover:text-foreground hover:bg-secondary/50 rounded-full transition-all duration-200"
                aria-label="My account"
              >
                <User className="w-4.5 h-4.5" strokeWidth={1.5} />
              </Link>

              <Link
                to="/wishlist"
                className="hidden md:flex p-2.5 text-foreground/60 hover:text-foreground hover:bg-secondary/50 rounded-full transition-all duration-200"
                aria-label="Wishlist"
              >
                <Heart className="w-4.5 h-4.5" strokeWidth={1.5} />
              </Link>
              
              <Link
                to="/checkout"
                className="relative p-2.5 text-foreground/60 hover:text-foreground hover:bg-secondary/50 rounded-full transition-all duration-200"
                aria-label={`Shopping bag${totalCount > 0 ? `, ${totalCount} items` : ''}`}
              >
                <ShoppingBag className="w-4.5 h-4.5" strokeWidth={1.5} />
                {totalCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-4 h-4 bg-foreground text-background text-[9px] font-bold flex items-center justify-center rounded-full"
                  >
                    {totalCount > 9 ? '9+' : totalCount}
                  </motion.span>
                )}
              </Link>

              <button
                className="lg:hidden p-2.5 text-foreground/60 hover:text-foreground hover:bg-secondary/50 rounded-full transition-all duration-200 ml-1"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="w-4.5 h-4.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-60 bg-background/98 backdrop-blur-xl"
            role="dialog"
            aria-label="Search"
          >
            <div className="max-w-2xl mx-auto px-6 pt-32">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div className="flex items-center gap-4 border-b-2 border-foreground/10 pb-4 focus-within:border-foreground/30 transition-colors">
                  <Search className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for frames, brands, styles..."
                    className="flex-1 text-xl bg-transparent focus:outline-none placeholder:text-muted-foreground/50 text-foreground"
                    autoFocus
                    aria-label="Search products"
                  />
                  <button
                    onClick={() => { setIsSearchOpen(false); setSearchQuery("") }}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all"
                    aria-label="Close search"
                  >
                    <X className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Quick Links */}
                <div className="mt-10">
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-4">Popular Searches</p>
                  <div className="flex flex-wrap gap-2">
                    {["Aviator", "Blue Light Glasses", "Polarized", "Round Frames", "Cat Eye", "Titanium"].map((term) => (
                      <button
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        className="px-4 py-2.5 text-sm border border-border hover:border-foreground/30 hover:bg-secondary rounded-full transition-all duration-200 text-foreground/80 hover:text-foreground"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trending */}
                <div className="mt-10">
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-4">Trending Now</p>
                  <div className="space-y-3">
                    {["Summer 2026 Collection", "Artisan Series - Limited Edition", "Sport Pro Range"].map((item) => (
                      <a
                        key={item}
                        href="/products"
                        className="flex items-center gap-3 py-2 text-foreground/70 hover:text-foreground transition-colors group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 group-hover:bg-foreground/60 transition-colors" />
                        {item}
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-55 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-60 bg-background shadow-2xl lg:hidden"
              role="dialog"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between h-18 px-6 border-b border-border">
                <span className="text-lg font-semibold tracking-[-0.02em] text-foreground">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 text-foreground/60 hover:text-foreground hover:bg-secondary rounded-full transition-all"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
              
              <nav className="p-6 overflow-y-auto h-[calc(100%-72px)]">
                <div className="space-y-1">
                  {navItems.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.1 }}
                    >
                      <Link
                        to={item.href}
                        className="flex items-center justify-between py-4 px-3 text-[17px] font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                        {item.hasDropdown && <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </Link>
                      {item.hasDropdown && (
                        <div className="pl-6 space-y-0.5 mb-2">
                          {item.items?.map((sub) => (
                            <Link
                              key={sub.label}
                              to={sub.href}
                              className="block py-2.5 px-3 text-[15px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Mobile bottom links */}
                <div className="mt-8 pt-8 border-t border-border space-y-1">
                  <Link to="/account" className="flex items-center gap-3 py-3 px-3 text-[15px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                    <User className="w-4 h-4" /> My Account
                  </Link>
                  <Link to="/account" className="flex items-center gap-3 py-3 px-3 text-[15px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                    <Heart className="w-4 h-4" /> Wishlist
                  </Link>
                  <a href="/stores" className="flex items-center gap-3 py-3 px-3 text-[15px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                    <MapPin className="w-4 h-4" /> Find a Store
                  </a>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
