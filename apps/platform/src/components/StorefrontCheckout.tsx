import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  CreditCard, 
  FileText, 
  MapPin, 
  ShoppingBag, 
  Gift, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Lock,
  Loader2
} from "lucide-react";
import { useCartStore } from "../lib/cartStore";
import { apiRequest } from "../lib/api";
import { Prescription, Order } from "../types";

interface StorefrontCheckoutProps {
  onNavigate: (route: string) => void;
}

interface ShippingFormValues {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes?: string;
}

export default function StorefrontCheckout({ onNavigate }: StorefrontCheckoutProps) {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice, getTotalItems } = useCartStore();

  // Active view matches either "cart" or "checkout" inside this selector module
  const [activeStep, setActiveStep] = useState<"cart" | "address" | "prescription" | "payment" | "success">("cart");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<number | null>(null);
  
  // Simulated gateway interaction states
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0); // value in dollars
  const [checkoutStepIdx, setCheckoutStepIdx] = useState(0);

  // Address Form configuration
  const { register, handleSubmit, formState: { errors } } = useForm<ShippingFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      notes: ""
    }
  });

  const [savedShippingData, setSavedShippingData] = useState<ShippingFormValues | null>(null);

  // Fetch verified prescriptions from API (only when prescription step is reached)
  useEffect(() => {
    if (activeStep !== "prescription") return;
    async function loadPrescriptions() {
      try {
        const res = await apiRequest<Prescription[]>("/prescriptions", "GET");
        setPrescriptions(res || []);
      } catch (_) {
        setPrescriptions([]);
      }
    }
    loadPrescriptions();
  }, [activeStep]);

  // Handle promo code validation via API
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setPromoError("");
    setPromoLoading(true);
    try {
      const res = await apiRequest<{ discount_amount: number; message: string }>("/promo/validate", "POST", {
        code,
        cart_total: getTotalPrice()
      });
      setAppliedDiscount(res.discount_amount || 0);
    } catch (err: any) {
      setPromoError(err?.message || "Invalid or expired promotional code.");
      setAppliedDiscount(0);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleAddressSubmit = (data: ShippingFormValues) => {
    setSavedShippingData(data);
    setActiveStep("prescription");
  };

  // Launch simulated checkout payment
  const handleFinalCheckout = async () => {
    setIsProcessingPayment(true);
    setPaymentError("");

    const calculatedTotal = Math.max(0, getTotalPrice() - appliedDiscount + 15.00); // including $15 express shipping

    try {
      const orderRes = await apiRequest<Order>("/orders", "POST", {
        total_amount: calculatedTotal,
        shipping_address: `${savedShippingData?.address}, ${savedShippingData?.city}, ${savedShippingData?.state} ${savedShippingData?.zipCode}`,
        name: savedShippingData?.fullName,
        email: savedShippingData?.email,
        items: items.map(i => ({
          product_id: i.id,
          product_name: i.name,
          quantity: i.quantity,
          price: i.price
        }))
      });

      if (orderRes) {
        if (selectedPrescriptionId) {
          await apiRequest(`/prescriptions/${selectedPrescriptionId}`, "PUT", {
            order_id: orderRes.id
          });
        }

        // 2. Load Razorpay script with timeout
        const loadRazorpayScript = () => {
          return new Promise((resolve) => {
            if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
              resolve(true);
              return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            const timeout = setTimeout(() => {
              script.onload = null;
              script.onerror = null;
              resolve(false);
            }, 10000); // 10 second timeout
            script.onload = () => { clearTimeout(timeout); resolve(true); };
            script.onerror = () => { clearTimeout(timeout); resolve(false); };
            document.body.appendChild(script);
          });
        };

        const res = await loadRazorpayScript();
        if (!res) {
          setPaymentError("Razorpay SDK failed to load. Are you offline?");
          setIsProcessingPayment(false);
          return;
        }

        // 3. Create Razorpay Order
        const rzpOrder = await apiRequest<any>("/payments/create-order", "POST", {
          order_id: orderRes.id
        });

        if (!rzpOrder) {
           setPaymentError("Failed to initiate secure payment gateway.");
           setIsProcessingPayment(false);
           return;
        }

        // 4. Launch Razorpay Checkout
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_mock", 
          amount: Math.round(rzpOrder.amount * 100), 
          currency: "INR",
          name: "Cromatic Vision Optical",
          description: `Order #${orderRes.id}`,
          order_id: rzpOrder.provider_order_id,
          handler: async function (response: any) {
            try {
              setIsProcessingPayment(true);
              await apiRequest("/payments/verify", "POST", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              setPlacedOrder(orderRes);
              clearCart();
              setActiveStep("success");
            } catch (err: any) {
              setPaymentError(err.message || "Payment verification failed.");
            } finally {
              setIsProcessingPayment(false);
            }
          },
          prefill: {
            name: savedShippingData?.fullName,
            email: savedShippingData?.email,
            contact: savedShippingData?.phone
          },
          theme: {
            color: "#2563EB"
          }
        };

        if (!(window as any).Razorpay) {
          setPaymentError("Payment gateway failed to initialize. Please refresh and try again.");
          setIsProcessingPayment(false);
          return;
        }

        const rzp1 = new (window as any).Razorpay(options);
        rzp1.on("payment.failed", function (response: any) {
          setPaymentError(response.error?.description || "Payment was declined. Please try again.");
          setIsProcessingPayment(false);
        });
        rzp1.open();
      } else {
        setPaymentError("Order could not be created. Please try again or contact support.");
      }
    } catch (error: any) {
      setPaymentError(error?.message || "Failed to process your order. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  // Render checkout cart screen if there are no items
  if (items.length === 0 && activeStep !== "success") {
    return (
      <div className="bg-background min-h-[85vh] py-24 px-6 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-medium text-foreground">Your bag is empty</h2>
            <p className="text-sm text-muted-foreground">Browse our collection and find your perfect pair of eyewear.</p>
          </div>
          <button
            onClick={() => onNavigate("products")}
            className="h-12 px-6 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            Browse Collection <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-[90vh] py-12 md:py-16 px-6 lg:px-10 max-w-360 mx-auto w-full">
      {/* Checkout step progress */}
      <div className="max-w-2xl mx-auto flex items-center justify-between mb-14 relative">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-border -z-10" />
        
        {[
          { tab: "cart", label: "Cart", num: "1" },
          { tab: "address", label: "Shipping", num: "2" },
          { tab: "prescription", label: "Prescription", num: "3" },
          { tab: "payment", label: "Payment", num: "4" }
        ].map((st) => {
          const stepNames = ["cart", "address", "prescription", "payment", "success"];
          const isCompleted = stepNames.indexOf(activeStep) > stepNames.indexOf(st.tab);
          const isActive = activeStep === st.tab;
          
          return (
            <button
              key={st.tab}
              disabled={stepNames.indexOf(st.tab) > stepNames.indexOf(activeStep)}
              onClick={() => setActiveStep(st.tab as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive 
                  ? "bg-foreground text-background" 
                  : isCompleted 
                    ? "bg-secondary text-foreground" 
                    : "bg-background border border-border text-muted-foreground cursor-not-allowed"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/10 text-[11px] font-semibold flex items-center justify-center">
                {isCompleted ? "✓" : st.num}
              </span>
              <span className="hidden sm:inline">{st.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Flow Switcher layout */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* STEP 1: Interactive Cart View */}
          {activeStep === "cart" && (
            <div className="space-y-6">
              <h2 className="text-xl font-light tracking-tight text-foreground border-b border-border pb-4">Your <span className="font-serif italic">Items</span></h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div 
                    key={item.id}
                    className="p-5 bg-card border border-border rounded-xl flex flex-col sm:flex-row items-center gap-5 justify-between"
                  >
                    <div className="flex items-center gap-4 self-start sm:self-center">
                      <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden shrink-0">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-foreground">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">Premium Eyewear</p>
                        <p className="text-sm font-semibold text-foreground">₹{item.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-5 border-t sm:border-t-0 border-border pt-4 sm:pt-0">
                      <div className="flex items-center border border-border rounded-full">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => onNavigate("products")}
                  className="h-12 px-6 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-secondary transition-all cursor-pointer"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => setActiveStep("address")}
                  className="h-12 px-6 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-all flex items-center gap-2 cursor-pointer hover:shadow-lg"
                >
                  Proceed to Shipping <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Shipping Form block */}
          {activeStep === "address" && (
            <div className="space-y-6">
              <h2 className="text-xl font-light tracking-tight text-foreground border-b border-border pb-4">Shipping <span className="font-serif italic">Address</span></h2>
              <form onSubmit={handleSubmit(handleAddressSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">Full Name</label>
                    <input
                      type="text"
                      {...register("fullName", { required: "Full name is required" })}
                      className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                      placeholder="John Doe"
                    />
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">Email Address</label>
                    <input
                      type="email"
                      {...register("email", { required: "Email is required" })}
                      className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                      placeholder="you@example.com"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">Phone Number</label>
                    <input
                      type="text"
                      {...register("phone", { required: "Phone number is required" })}
                      className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">ZIP / Postal Code</label>
                    <input
                      type="text"
                      {...register("zipCode", { required: "ZIP code is required" })}
                      className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                      placeholder="400001"
                    />
                    {errors.zipCode && <p className="text-xs text-red-500 mt-1">{errors.zipCode.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">Street Address</label>
                    <input
                      type="text"
                      {...register("address", { required: "Street address is required" })}
                      className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                      placeholder="123 Main Street, Apt 4B"
                    />
                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">City</label>
                    <input
                      type="text"
                      {...register("city", { required: "City is required" })}
                      className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                      placeholder="Mumbai"
                    />
                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">State / Province</label>
                  <input
                    type="text"
                    {...register("state", { required: "State is required" })}
                    className="w-full md:w-1/2 h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                    placeholder="Maharashtra"
                  />
                  {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setActiveStep("cart")}
                    className="h-12 px-6 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-secondary transition-all cursor-pointer"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    className="h-12 px-6 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-all flex items-center gap-2 cursor-pointer hover:shadow-lg"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Prescription Upload / Selection */}
          {activeStep === "prescription" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <h2 className="text-xl font-light tracking-tight text-foreground">Select <span className="font-serif italic">Prescription</span></h2>
                <button
                  onClick={() => onNavigate("prescriptions")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Upload New
                </button>
              </div>

              <p className="text-sm text-muted-foreground">Attach your verified prescription for lens customization.</p>

              {prescriptions.length === 0 ? (
                <div className="p-10 bg-secondary/30 border border-dashed border-border rounded-xl text-center space-y-4">
                  <p className="text-sm text-muted-foreground">No prescriptions uploaded yet.</p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => onNavigate("prescriptions")}
                      className="h-10 px-5 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-all cursor-pointer"
                    >
                      Upload Prescription
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPrescriptionId(null);
                        setActiveStep("payment");
                      }}
                      className="h-10 px-5 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-secondary transition-all cursor-pointer"
                    >
                      Add Later
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        onClick={() => setSelectedPrescriptionId(rx.id)}
                        className={`p-5 border rounded-xl cursor-pointer transition-all ${
                          selectedPrescriptionId === rx.id ? "border-foreground bg-secondary/50 ring-1 ring-foreground/10" : "border-border hover:border-foreground/20 hover:bg-secondary/30"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Prescription</p>
                            <h4 className="text-sm font-medium text-foreground mt-1">Rx #{rx.id}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Uploaded {new Date(rx.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                            rx.status === "APPROVED" 
                              ? "text-green-700 bg-green-50 border-green-200" 
                              : "text-amber-700 bg-amber-50 border-amber-200"
                          }`}>
                            {rx.status}
                          </span>
                        </div>
                        {rx.notes && <p className="text-xs text-muted-foreground mt-3 line-clamp-1 italic">"{rx.notes}"</p>}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-border">
                    <button
                      onClick={() => {
                        setSelectedPrescriptionId(null);
                        setActiveStep("payment");
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Skip for now
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setActiveStep("address")}
                        className="h-12 px-6 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-secondary transition-all cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setActiveStep("payment")}
                        className="h-12 px-6 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-all flex items-center gap-2 cursor-pointer hover:shadow-lg"
                      >
                        Review Order <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Checkout Summary review & launch payment */}
          {activeStep === "payment" && (
            <div className="space-y-6">
              <h2 className="text-xl font-light tracking-tight text-foreground border-b border-border pb-4">Order <span className="font-serif italic">Review</span></h2>

              <div className="p-6 bg-card border border-border rounded-xl space-y-5">
                {/* Shipping info */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 flex items-center justify-center bg-secondary rounded-lg shrink-0">
                    <MapPin className="w-4 h-4 text-foreground/70" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Shipping To</p>
                    <p className="text-sm font-medium text-foreground">{savedShippingData?.fullName}</p>
                    <p className="text-sm text-muted-foreground">{savedShippingData?.address}, {savedShippingData?.city}, {savedShippingData?.state} {savedShippingData?.zipCode}</p>
                    <p className="text-xs text-muted-foreground">{savedShippingData?.phone} · {savedShippingData?.email}</p>
                  </div>
                </div>

                {/* Selected Prescription */}
                {selectedPrescriptionId && (
                  <div className="flex items-start gap-3.5 border-t border-border pt-5">
                    <div className="w-10 h-10 flex items-center justify-center bg-secondary rounded-lg shrink-0">
                      <FileText className="w-4 h-4 text-foreground/70" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Prescription Attached</p>
                      <p className="text-sm font-medium text-foreground">Prescription #{selectedPrescriptionId}</p>
                      <p className="text-sm text-muted-foreground">Your lenses will be crafted to match this prescription.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Secure payment notice */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-sm text-blue-700">
                <Lock className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Your payment is secured with 256-bit encryption via Razorpay.</span>
              </div>

              {paymentError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => setActiveStep("prescription")}
                  className="h-12 px-6 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-secondary transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleFinalCheckout}
                  disabled={isProcessingPayment}
                  id="btn-process-checkout"
                  className="h-12 px-8 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-all flex items-center gap-2 cursor-pointer hover:shadow-lg disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" /> Pay Now
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Order Placed Success View */}
          {activeStep === "success" && placedOrder && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 bg-card border border-border rounded-xl text-center space-y-6 max-w-lg mx-auto"
            >
              <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-light tracking-tight text-foreground">Thank You!</h3>
                <p className="text-sm text-muted-foreground">Your order has been placed successfully.</p>
                <div className="inline-block mt-3 px-4 py-2 bg-secondary rounded-lg">
                  <p className="text-sm font-medium text-foreground">Order #{placedOrder.id}</p>
                </div>
              </div>

              <div className="p-4 bg-secondary/50 border border-border rounded-lg text-left text-sm space-y-2">
                <p className="text-xs font-medium text-foreground">What happens next?</p>
                <p className="text-muted-foreground">1. Our optical lab will prepare your lenses.</p>
                <p className="text-muted-foreground">2. An invoice has been generated for your records.</p>
                <p className="text-muted-foreground">3. Track your order status in your account.</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => onNavigate("orders")}
                  className="h-12 px-6 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-secondary transition-all cursor-pointer"
                >
                  View Orders
                </button>
                <button
                  onClick={() => onNavigate("products")}
                  className="h-12 px-6 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-all cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </motion.div>
          )}

        </div>

        {/* Right Column: Order Summary Sidebar */}
        {activeStep !== "success" && (
          <div className="lg:col-span-4 bg-card border border-border p-6 rounded-xl space-y-5 sticky top-24">
            <h3 className="text-sm font-medium text-foreground border-b border-border pb-3">Order Summary</h3>

            {/* Items list */}
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="space-y-0.5 max-w-[70%]">
                    <h5 className="font-medium text-foreground truncate">{item.name}</h5>
                    <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <span className="font-medium text-foreground">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Promo Code */}
            <form onSubmit={handleApplyPromo} className="border-t border-border pt-4 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value); setPromoError(""); }}
                  className="flex-1 h-10 px-3 border border-border bg-background rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 transition-all"
                />
                <button
                  type="submit"
                  disabled={promoLoading || !promoCode.trim()}
                  className="h-10 px-4 bg-secondary text-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 transition-all cursor-pointer disabled:opacity-50 border border-border"
                >
                  {promoLoading ? "..." : "Apply"}
                </button>
              </div>
              {promoError && <p className="text-xs text-red-500">{promoError}</p>}
              {appliedDiscount > 0 && <p className="text-xs text-green-600 font-medium">Discount of ₹{appliedDiscount.toLocaleString()} applied!</p>}
            </form>

            {/* Totals */}
            <div className="space-y-3 pt-4 border-t border-border text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{getTotalPrice().toLocaleString()}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{appliedDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>₹1,500</span>
              </div>
              
              <div className="flex justify-between text-foreground font-semibold pt-3 border-t border-border text-base">
                <span>Total</span>
                <span>₹{Math.max(0, getTotalPrice() - appliedDiscount + 1500).toLocaleString()}</span>
              </div>
            </div>

            {/* Trust signals */}
            <div className="p-4 bg-secondary/50 rounded-lg flex items-start gap-3 text-xs text-muted-foreground">
              <Gift className="w-4 h-4 text-foreground/60 shrink-0 mt-0.5" />
              <span>Includes premium leather case, cleaning cloth, and micro screwdriver kit.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
