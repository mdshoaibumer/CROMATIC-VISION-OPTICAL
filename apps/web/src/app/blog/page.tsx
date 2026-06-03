"use client";

import { useState } from "react";

import Link from "next/link";
import { Clock } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/ui/page-hero";

const categories = ["All", "Eye Care", "Style Guide", "Lens Technology", "Health Tips", "News"];

const posts = [
  {
    id: 1,
    title: "The Complete Guide to Blue Light Blocking Lenses",
    excerpt: "Understand how blue light affects your eyes and discover the best lens solutions for digital screen protection.",
    category: "Lens Technology",
    readTime: "5 min read",
    date: "May 28, 2026",
    featured: true,
  },
  {
    id: 2,
    title: "How to Choose the Perfect Frame for Your Face Shape",
    excerpt: "A comprehensive guide to finding eyewear that complements your unique facial features and personal style.",
    category: "Style Guide",
    readTime: "7 min read",
    date: "May 25, 2026",
    featured: true,
  },
  {
    id: 3,
    title: "5 Signs You Need an Eye Test (And What to Expect)",
    excerpt: "Don't ignore these common symptoms. Learn when it's time to visit an optometrist and what happens during an exam.",
    category: "Eye Care",
    readTime: "4 min read",
    date: "May 22, 2026",
    featured: false,
  },
  {
    id: 4,
    title: "Progressive Lenses vs Bifocals: Which Is Right for You?",
    excerpt: "Compare the pros and cons of progressive and bifocal lenses to make an informed decision about your vision correction.",
    category: "Lens Technology",
    readTime: "6 min read",
    date: "May 18, 2026",
    featured: false,
  },
  {
    id: 5,
    title: "UV Protection: Why Your Sunglasses Matter More Than You Think",
    excerpt: "The science behind UV damage to your eyes and how to choose sunglasses that truly protect your vision.",
    category: "Health Tips",
    readTime: "5 min read",
    date: "May 15, 2026",
    featured: false,
  },
  {
    id: 6,
    title: "2026 Eyewear Trends: What's In This Season",
    excerpt: "From oversized acetate frames to titanium minimalism, explore the hottest eyewear trends for 2026.",
    category: "Style Guide",
    readTime: "4 min read",
    date: "May 10, 2026",
    featured: false,
  },
  {
    id: 7,
    title: "Contact Lens Care: Essential Tips for Healthy Eyes",
    excerpt: "Proper lens hygiene can prevent infections and extend lens life. Follow these expert-recommended practices.",
    category: "Eye Care",
    readTime: "5 min read",
    date: "May 5, 2026",
    featured: false,
  },
  {
    id: 8,
    title: "Cromatic Vision Opens 50th Store in India",
    excerpt: "We're proud to announce our milestone 50th store, bringing premium eyewear and vision care to more communities.",
    category: "News",
    readTime: "3 min read",
    date: "May 1, 2026",
    featured: false,
  },
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPosts = activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory);
  const featuredPosts = posts.filter((p) => p.featured);

  return (
    <div className="page-transition">
      <PageHero
        title="Vision Blog"
        description="Expert insights on eye care, style guides, and the latest in lens technology."
        breadcrumb="Blog"
        badge="Expert Insights"
      />

      {/* Featured Posts */}
      <section className="py-12 lg:py-16 bg-white border-b border-neutral-100/80">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.2em] mb-6">Featured</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {featuredPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`} className="group block">
                <div className="hover-card bg-linear-to-br from-neutral-50 to-neutral-100/50 rounded-3xl p-8 h-full border border-neutral-100/80">
                  <Badge variant="premium" className="mb-4">{post.category}</Badge>
                  <h3 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-3 group-hover:text-amber-700 transition-colors font-(family-name:--font-playfair)">
                    {post.title}
                  </h3>
                  <p className="text-neutral-500 mb-6 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </span>
                    <span>{post.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-16 lg:top-20 z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-100/80">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-neutral-900 text-white shadow-lg"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* All Posts */}
      <section className="py-12 lg:py-16 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPosts.map((post) => (
              <StaggerItem key={post.id}>
                <Link href={`/blog/${post.id}`} className="group block h-full">
                  <div className="hover-card bg-white rounded-2xl p-6 border border-neutral-100/80 h-full flex flex-col">
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-3">{post.category}</Badge>
                      <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-amber-700 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-neutral-500 line-clamp-3 mb-4">{post.excerpt}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-400 pt-4 border-t border-neutral-100/80">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readTime}
                      </span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}
