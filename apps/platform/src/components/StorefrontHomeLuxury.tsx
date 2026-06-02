import { lazy, Suspense } from "react"
import { Navbar } from "./storefront/Navbar"
import { Hero } from "./storefront/Hero"
import { TrustSignals } from "./storefront/TrustSignals"

// Lazy load below-the-fold sections
const Categories = lazy(() => import("./storefront/Categories").then(m => ({ default: m.Categories })))
const Bestsellers = lazy(() => import("./storefront/Bestsellers").then(m => ({ default: m.Bestsellers })))
const FeaturedCollections = lazy(() => import("./storefront/FeaturedCollections").then(m => ({ default: m.FeaturedCollections })))
const Brands = lazy(() => import("./storefront/Brands").then(m => ({ default: m.Brands })))
const Testimonials = lazy(() => import("./storefront/Testimonials").then(m => ({ default: m.Testimonials })))
const Newsletter = lazy(() => import("./storefront/Newsletter").then(m => ({ default: m.Newsletter })))
const Footer = lazy(() => import("./storefront/Footer").then(m => ({ default: m.Footer })))

function SectionFallback() {
  return <div className="min-h-50" />
}

export default function StorefrontHomeLuxury() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-foreground focus:text-background focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <main id="main-content" className="min-h-screen bg-background">
        <Navbar />
        <Hero />
        <TrustSignals />
        <Suspense fallback={<SectionFallback />}>
          <Categories />
          <Bestsellers />
          <FeaturedCollections />
          <Brands />
          <Testimonials />
          <Newsletter />
          <Footer />
        </Suspense>
      </main>
    </>
  )
}
