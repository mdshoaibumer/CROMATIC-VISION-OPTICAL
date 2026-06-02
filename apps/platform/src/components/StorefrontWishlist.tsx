import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlistStore } from "../lib/wishlistStore";
import { useCartStore } from "../lib/cartStore";
import { PageContainer, SectionHeader, Reveal, EmptyState } from "./storefront/SharedLayout";

interface StorefrontWishlistProps {
  onNavigate: (path: string) => void;
}

export default function StorefrontWishlist({ onNavigate }: StorefrontWishlistProps) {
  const { items, removeItem, clearAll } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();

  const handleAddToCart = async (productId: number) => {
    await addToCart(productId, 1);
    removeItem(productId);
  };

  if (items.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          icon={<Heart className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />}
          title="Your wishlist is empty"
          description="Save items you love by tapping the heart icon on any product. They'll appear here for easy access."
          action="Browse Collection"
          onAction={() => onNavigate("/products")}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <SectionHeader
            label="Wishlist"
            heading="Saved"
            headingItalic="Favourites"
            description={`${items.length} item${items.length !== 1 ? "s" : ""} saved for later.`}
          />

          <button
            onClick={clearAll}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <Reveal key={item.product_id} delay={i * 0.05}>
                <motion.div
                  layout
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  className="group bg-card border border-border rounded-xl overflow-hidden"
                >
                  {/* Image */}
                  <div
                    className="aspect-4/5 bg-secondary relative overflow-hidden cursor-pointer"
                    onClick={() => onNavigate(`/products?product=${item.slug}`)}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeItem(item.product_id); }}
                      className="absolute top-3 right-3 w-9 h-9 bg-background/90 backdrop-blur-sm border border-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Sale badge */}
                    {item.sale_price && (
                      <span className="absolute top-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full bg-foreground text-background">
                        Sale
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      {item.brand && (
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{item.brand}</p>
                      )}
                      <h3
                        className="text-sm font-medium text-foreground truncate cursor-pointer hover:underline"
                        onClick={() => onNavigate(`/products?product=${item.slug}`)}
                      >
                        {item.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        {item.sale_price ? (
                          <>
                            <span className="text-sm font-semibold text-foreground">₹{item.sale_price.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground line-through">₹{item.price.toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="text-sm font-semibold text-foreground">₹{item.price.toLocaleString()}</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(item.product_id)}
                        className="h-9 px-3 bg-foreground text-background text-xs font-medium rounded-lg hover:bg-foreground/90 transition-all cursor-pointer flex items-center gap-1.5"
                        aria-label="Move to cart"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </AnimatePresence>
        </div>

        {/* Continue shopping */}
        <div className="text-center pt-4">
          <button
            onClick={() => onNavigate("/products")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
