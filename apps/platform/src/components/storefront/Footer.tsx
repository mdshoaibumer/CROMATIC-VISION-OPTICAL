import { Link } from "react-router-dom"
import { Instagram, Twitter, Facebook, MapPin, Phone, Mail } from "lucide-react"

const footerLinks = {
  shop: {
    title: "Shop",
    links: [
      { name: "Eyeglasses", href: "/products?category=eyeglasses" },
      { name: "Sunglasses", href: "/products?category=sunglasses" },
      { name: "Blue Light", href: "/products?category=blue-light" },
      { name: "Contact Lenses", href: "/products?category=contact-lenses" },
      { name: "New Arrivals", href: "/products?sort=newest" },
    ]
  },
  brands: {
    title: "Brands",
    links: [
      { name: "Ray-Ban", href: "/products?brand=ray-ban" },
      { name: "Oakley", href: "/products?brand=oakley" },
      { name: "Gucci", href: "/products?brand=gucci" },
      { name: "Tom Ford", href: "/products?brand=tom-ford" },
      { name: "View All", href: "/products" },
    ]
  },
  support: {
    title: "Support",
    links: [
      { name: "Help Center", href: "/help" },
      { name: "Track Order", href: "/account" },
      { name: "Returns & Exchanges", href: "/returns" },
      { name: "Shipping Info", href: "/shipping" },
      { name: "Contact Us", href: "/contact" },
    ]
  },
  company: {
    title: "Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Our Stores", href: "/stores" },
      { name: "Careers", href: "/careers" },
      { name: "Sustainability", href: "/sustainability" },
      { name: "Press", href: "/press" },
    ]
  }
}

const socialLinks = [
  { icon: Instagram, href: "#", label: "Follow us on Instagram" },
  { icon: Twitter, href: "#", label: "Follow us on Twitter" },
  { icon: Facebook, href: "#", label: "Follow us on Facebook" },
]

export function Footer() {
  return (
    <footer className="border-t border-border" role="contentinfo">
      {/* Trust Signals Bar */}
      <div className="border-b border-border">
        <div className="max-w-360 mx-auto px-6 lg:px-10 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: "🚚", title: "Free Shipping", desc: "On orders above ₹3,000" },
              { icon: "↩️", title: "Easy Returns", desc: "14-day hassle-free returns" },
              { icon: "🛡️", title: "1 Year Warranty", desc: "On all frames & lenses" },
              { icon: "👁️", title: "Eye Test at Home", desc: "Book a free appointment" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-360 mx-auto px-6 lg:px-10 py-14 lg:py-18">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link to="/" className="inline-block" aria-label="Cromatic Vision - Home">
              <span className="text-[22px] font-semibold tracking-[-0.03em] text-foreground">
                Cromatic<span className="font-light ml-1">Vision</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Premium eyewear for discerning individuals. Quality frames, exceptional service, crafted with precision since 2020.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-foreground hover:text-background transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" strokeWidth={1.5} />
                </a>
              ))}
            </div>

            {/* Contact info */}
            <div className="mt-6 space-y-2">
              <a href="tel:+911234567890" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="w-3.5 h-3.5" /> +91 123 456 7890
              </a>
              <a href="mailto:hello@cromaticvision.com" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-3.5 h-3.5" /> hello@cromaticvision.com
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-medium mb-4 text-foreground">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
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
      <div className="border-t border-border">
        <div className="max-w-360 mx-auto px-6 lg:px-10 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © 2026 Cromatic Vision Optical. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link to="/accessibility" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
