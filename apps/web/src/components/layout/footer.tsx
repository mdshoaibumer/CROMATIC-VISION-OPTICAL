import Link from "next/link";
import {
  MapPin,

  Phone,
  Mail,
  Globe,
} from "lucide-react";

const footerLinks = {
  shop: {
    title: "Shop",
    links: [
      { name: "Eyeglasses", href: "/eyeglasses" },
      { name: "Sunglasses", href: "/sunglasses" },
      { name: "Contact Lenses", href: "/contact-lenses" },
      { name: "Computer Glasses", href: "/eyeglasses?type=computer" },
      { name: "Reading Glasses", href: "/eyeglasses?type=reading" },
    ],
  },
  services: {
    title: "Services",
    links: [
      { name: "Book Eye Test", href: "/eye-test" },
      { name: "Find a Store", href: "/store-locator" },
      { name: "Virtual Try-On", href: "/virtual-try-on" },
      { name: "Lens Guide", href: "/lens-guide" },
      { name: "Frame Size Guide", href: "/frame-size-guide" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
      { name: "Contact Us", href: "/contact" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { name: "FAQ", href: "/faq" },
      { name: "Shipping & Returns", href: "/shipping-returns" },
      { name: "Warranty", href: "/warranty" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms & Conditions", href: "/terms" },
    ],
  },
};

export function Footer() {
  return (
    <footer className="bg-neutral-950 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold mb-2 font-(family-name:--font-playfair)">
                Stay in the loop
              </h3>
              <p className="text-neutral-400 text-sm">
                Get exclusive offers, new arrivals & vision care tips delivered to your inbox.
              </p>
            </div>
            <div className="flex w-full lg:w-auto gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 lg:w-72 h-12 px-5 rounded-full bg-neutral-800/50 border border-neutral-700/50 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
              <button className="h-12 px-8 bg-linear-to-r from-amber-500 to-amber-600 text-white font-medium rounded-full hover:from-amber-400 hover:to-amber-500 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-8 lg:mb-0">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-white to-neutral-300 flex items-center justify-center">
                <span className="text-neutral-900 font-bold text-lg">C</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">Cromatic Vision</h2>
                <p className="text-[10px] text-neutral-500 tracking-widest uppercase">
                  Optical
                </p>
              </div>
            </Link>
            <p className="text-sm text-neutral-400 mb-6 max-w-xs">
              Your Vision, Our Care. Premium eyewear solutions with expert care since 2020.
            </p>
            <div className="space-y-3 text-sm text-neutral-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500" />
                <span>1800-123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                <span>care@cromaticvision.com</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5" />
                <span>50+ Stores across India</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-sm mb-4 text-white">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-400 hover:text-amber-400 transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            © 2026 Cromatic Vision Optical. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-neutral-500 hover:text-amber-400 transition-colors" aria-label="Instagram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </Link>
            <Link href="#" className="text-neutral-500 hover:text-amber-400 transition-colors" aria-label="Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </Link>
            <Link href="#" className="text-neutral-500 hover:text-amber-400 transition-colors" aria-label="Twitter">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </Link>
            <Link href="#" className="text-neutral-500 hover:text-amber-400 transition-colors" aria-label="YouTube">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
