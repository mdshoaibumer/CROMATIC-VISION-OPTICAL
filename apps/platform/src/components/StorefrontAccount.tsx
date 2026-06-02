import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  MapPin, 
  FileText, 
  Calendar, 
  Download, 
  Upload, 
  ShoppingBag, 
  CheckCircle2, 
  Eye, 
  Search, 
  Trash2,
  Clock,
  ArrowRight,
  Phone,
  Mail,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Lock,
  ExternalLink
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { Order, Prescription, Invoice, User as CustomerUser } from "../types";

interface StorefrontAccountProps {
  initialSubTab?: "profile" | "orders" | "prescriptions" | "invoices";
  onNavigate: (route: string) => void;
}

interface ProfileFormValues {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

interface PrescUploadFormValues {
  notes: string;
  fileUrl: string;
}

export default function StorefrontAccount({ initialSubTab = "profile", onNavigate }: StorefrontAccountProps) {
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "orders" | "prescriptions" | "invoices">(initialSubTab);
  
  // Storage lists
  const [activeCustomer, setActiveCustomer] = useState<CustomerUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // Focus views
  const [focusedOrderId, setFocusedOrderId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Profile Form setup
  const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfile } = useForm<ProfileFormValues>();

  // Prescription Form setup
  const { register: registerPresc, handleSubmit: handlePrescSubmit, reset: resetPresc, watch: watchPresc } = useForm<PrescUploadFormValues>({
    defaultValues: {
      notes: "",
      fileUrl: ""
    }
  });

  const previewFileUrl = watchPresc("fileUrl");

  // Load user data on mount
  useEffect(() => {
    async function loadUserData() {
      // Get current logged-in customer info
      try {
        const me = await apiRequest<CustomerUser>("/auth/me", "GET");
        setActiveCustomer(me);
        resetProfile({
          name: me.name,
          email: me.email,
          phone: me.phone || "",
          address: ""
        });
      } catch (_) {
        // If no user found from API or offline, clear local auth
        localStorage.removeItem("cromatic_active_customer");
        setActiveCustomer(null);
      }

      // Load orders
      try {
        const orderList = await apiRequest<Order[]>("/orders", "GET");
        setOrders(orderList || []);
      } catch (_) {
        setOrders([]);
      }

      // Load prescriptions
      try {
        const rxList = await apiRequest<Prescription[]>("/prescriptions", "GET");
        setPrescriptions(rxList || []);
      } catch (_) {
        setPrescriptions([]);
      }

      // Load invoices
      try {
        const invList = await apiRequest<Invoice[]>("/invoices", "GET");
        setInvoices(invList || []);
      } catch (_) {
        setInvoices([]);
      }
    }

    loadUserData();
  }, []); // Load once on mount, not on every tab switch

  // Update profile handler
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const onUpdateProfile = async (data: ProfileFormValues) => {
    if (!activeCustomer || profileSaving) return;
    setProfileSaving(true);
    try {
      await apiRequest("/auth/me", "PUT", {
        name: data.name,
        phone: data.phone
      });
      const updated = { ...activeCustomer, name: data.name, phone: data.phone };
      setActiveCustomer(updated);
      localStorage.setItem("cromatic_active_customer", JSON.stringify(updated));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      alert(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Upload simulated prescription file
  const onUploadPrescription = async (data: PrescUploadFormValues) => {
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const res = await apiRequest<Prescription>("/prescriptions", "POST", {
        file_url: data.fileUrl,
        notes: data.notes
      });
      if (res) {
        setPrescriptions(prev => [...prev, res]);
        setUploadSuccess(true);
        resetPresc();
        setTimeout(() => setUploadSuccess(false), 4000);
      }
    } catch (_) {
      alert("Verification server was offline.");
    } finally {
      setIsUploading(false);
    }
  };

  // Filter lists by current active user
  const userOrders = orders;
  const userPrescriptions = prescriptions;
  
  // Gather invoice from our user's order lists
  const userInvoices = invoices;

  const focusedOrder = orders.find(o => o.id === focusedOrderId);

  return (
    <div className="bg-background min-h-[90vh] py-12 md:py-16 px-6 lg:px-10 max-w-360 mx-auto w-full">
      
      {/* Account Dashboard header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-border">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">Account</p>
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-light tracking-[-0.02em] text-foreground">
            Welcome, <span className="font-serif italic">{activeCustomer?.name?.split(" ")[0] || "User"}</span>
          </h1>
          <p className="text-sm text-muted-foreground">Manage your orders, prescriptions, and account settings.</p>
        </div>

        {/* Tab navigation */}
        <div className="flex bg-secondary p-1 rounded-lg text-sm">
          {[
            { id: "profile", label: "Profile" },
            { id: "orders", label: "Orders" },
            { id: "prescriptions", label: "Prescriptions" },
            { id: "invoices", label: "Invoices" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setFocusedOrderId(null);
              }}
              className={`px-4 py-2 rounded-md cursor-pointer transition-all font-medium ${
                activeSubTab === tab.id 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* VIEW 1: Customer Profile */}
        {activeSubTab === "profile" && (
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-card border border-border p-6 rounded-xl space-y-6">
              <h3 className="text-base font-medium text-foreground border-b border-border pb-3">Personal Details</h3>
              <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">Full Name</label>
                    <input
                      type="text"
                      {...registerProfile("name")}
                      className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">Phone</label>
                    <input
                      type="text"
                      {...registerProfile("phone")}
                      className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">Email Address</label>
                  <input
                    type="email"
                    disabled
                    {...registerProfile("email")}
                    className="w-full h-11 px-4 border border-border bg-secondary text-muted-foreground cursor-not-allowed rounded-lg text-sm"
                    title="Email cannot be changed"
                  />
                  <p className="text-xs text-muted-foreground">Email address cannot be modified.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">Delivery Address</label>
                  <input
                    type="text"
                    {...registerProfile("address")}
                    className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                    placeholder="Enter your default shipping address"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="h-11 px-6 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {profileSaving ? "Saving..." : "Save Changes"}
                  </button>
                  {profileSaved && (
                    <span className="ml-3 text-sm text-green-600 font-medium">Profile updated!</span>
                  )}
                </div>
              </form>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border p-5 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2">Total Orders</p>
                <p className="text-2xl font-light text-foreground">{userOrders.length}</p>
              </div>
              <div className="bg-card border border-border p-5 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2">Prescriptions</p>
                <p className="text-2xl font-light text-foreground">{userPrescriptions.length}</p>
              </div>
              <div className="bg-card border border-border p-5 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2">Account Status</p>
                <p className="text-sm font-medium text-green-600 flex items-center gap-1.5 mt-1">
                  <ShieldCheck className="w-4 h-4" /> Verified
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Orders */}
        {activeSubTab === "orders" && (
          <div className="lg:col-span-12 space-y-6">
            {!focusedOrderId ? (
              <div className="space-y-4">
                <h3 className="text-base font-medium text-foreground border-b border-border pb-3">Your Orders</h3>
                
                {userOrders.length === 0 ? (
                  <div className="p-14 text-center bg-card border border-border rounded-xl space-y-3">
                    <div className="w-14 h-14 mx-auto flex items-center justify-center bg-secondary rounded-2xl">
                      <ShoppingBag className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-muted-foreground">No orders yet. Start shopping to see your orders here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.map((o) => {
                      const colorMap: Record<string, string> = {
                        PENDING: "text-amber-700 bg-amber-50 border-amber-200",
                        PAID: "text-blue-700 bg-blue-50 border-blue-200",
                        PROCESSING: "text-green-700 bg-green-50 border-green-200",
                        SHIPPED: "text-purple-700 bg-purple-50 border-purple-200",
                        DELIVERED: "text-green-700 bg-green-50 border-green-200"
                      };
                      return (
                        <div
                          key={o.id}
                          className="p-5 bg-card border border-border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Order #{o.id}</p>
                            <h4 className="text-sm font-medium text-foreground">Placed {new Date(o.created_at).toLocaleDateString()}</h4>
                            <p className="text-xs text-muted-foreground truncate max-w-sm">{o.shipping_address}</p>
                          </div>

                          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-0 border-border">
                            <div className="text-left md:text-right">
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="text-sm font-semibold text-foreground">₹{o.total_amount.toLocaleString()}</p>
                            </div>

                            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${colorMap[o.status] || "text-muted-foreground border-border bg-secondary"}`}>
                              {o.status}
                            </span>

                            <button
                              onClick={() => setFocusedOrderId(o.id)}
                              className="h-9 px-3 bg-secondary border border-border text-sm font-medium text-foreground rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              focusedOrder && (
                <div className="bg-card border border-border p-6 md:p-8 rounded-xl space-y-6">
                  <div className="flex justify-between items-center border-b border-border pb-5">
                    <div>
                      <button
                        onClick={() => setFocusedOrderId(null)}
                        className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        ← Back to orders
                      </button>
                      <h3 className="text-lg font-medium text-foreground">Order #{focusedOrder.id}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(focusedOrder.created_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Order tracking */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-secondary/50 border border-border rounded-lg text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Payment</p>
                      <p className="font-medium text-green-600">Confirmed</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Processing</p>
                      <p className="font-medium text-foreground">
                        {focusedOrder.status === "PENDING" ? "In Queue" : "Complete"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Tracking</p>
                      <p className="font-medium text-foreground truncate">
                        {focusedOrder.tracking_number || "Pending"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-semibold text-foreground">{focusedOrder.status}</p>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Items</h4>
                    <div className="divide-y divide-border">
                      {(focusedOrder.items || []).map(item => (
                        <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                          <div className="space-y-0.5">
                            <h5 className="font-medium text-foreground">{item.product_name}</h5>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <span className="font-medium text-foreground">₹{item.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-between items-end">
                    <div>
                      <p className="text-xs text-muted-foreground">Shipping</p>
                      <p className="text-sm text-foreground mt-1 max-w-sm">{focusedOrder.shipping_address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-semibold text-foreground">₹{focusedOrder.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* VIEW 3: Prescriptions Manager */}
        {activeSubTab === "prescriptions" && (
          <div className="lg:col-span-12 space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Upload Form */}
              <div className="lg:col-span-5 bg-card border border-border p-6 rounded-xl space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-medium text-foreground">Upload Prescription</h3>
                  <p className="text-sm text-muted-foreground">Upload your optometrist-verified prescription.</p>
                </div>

                <form onSubmit={handlePrescSubmit(onUploadPrescription)} className="space-y-4">
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">Prescription Image URL</label>
                    <input
                      type="text"
                      {...registerPresc("fileUrl", { required: "A prescription URL is required" })}
                      className="w-full h-11 px-4 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm"
                      placeholder="https://example.com/prescription.jpg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground block">Notes (optional)</label>
                    <textarea
                      {...registerPresc("notes")}
                      className="w-full h-24 px-4 py-3 border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5 rounded-lg transition-all text-sm resize-none"
                      placeholder="PD, cylinder, anti-glare preferences..."
                    />
                  </div>

                  {uploadSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Prescription uploaded successfully!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full h-12 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" /> {isUploading ? "Uploading..." : "Upload Prescription"}
                  </button>
                </form>

                {previewFileUrl && (
                  <div className="space-y-2 border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">Preview</p>
                    <div className="aspect-video rounded-lg overflow-hidden border border-border bg-secondary">
                      <img src={previewFileUrl} alt="Prescription preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                )}
              </div>

              {/* Prescriptions List */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-sm font-medium text-foreground">Your Prescriptions</h3>
                
                {userPrescriptions.length === 0 ? (
                  <div className="p-14 text-center bg-card border border-border rounded-xl space-y-2">
                    <p className="text-sm text-muted-foreground">No prescriptions uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userPrescriptions.map(rx => {
                      const colorMap: Record<string, string> = {
                        APPROVED: "text-green-700 bg-green-50 border-green-200",
                        PENDING: "text-amber-700 bg-amber-50 border-amber-200",
                        REJECTED: "text-red-700 bg-red-50 border-red-200",
                        REVIEWED: "text-blue-700 bg-blue-50 border-blue-200"
                      };

                      return (
                        <div
                          key={rx.id}
                          className="p-5 bg-card border border-border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-secondary rounded-lg overflow-hidden shrink-0">
                              <img src={rx.file_url} alt="Prescription" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Prescription #{rx.id}</p>
                              <h4 className="text-sm font-medium text-foreground">Uploaded {new Date(rx.created_at).toLocaleDateString()}</h4>
                              {rx.notes && <p className="text-xs text-muted-foreground italic truncate max-w-xs">"{rx.notes}"</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full md:w-auto justify-between border-t md:border-t-0 border-border pt-3 md:pt-0">
                            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${colorMap[rx.status] || "text-muted-foreground border-border bg-secondary"}`}>
                              {rx.status}
                            </span>
                            <a 
                              href={rx.file_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="h-9 px-3 bg-secondary border border-border text-sm font-medium text-foreground rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* VIEW 4: Invoices */}
        {activeSubTab === "invoices" && (
          <div className="lg:col-span-12 space-y-6">
            <h3 className="text-base font-medium text-foreground border-b border-border pb-3">Invoices</h3>
            
            {userInvoices.length === 0 ? (
              <div className="p-14 text-center bg-card border border-border rounded-xl space-y-3">
                <div className="w-14 h-14 mx-auto flex items-center justify-center bg-secondary rounded-2xl">
                  <FileText className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-muted-foreground">No invoices yet. Invoices are generated after placing orders.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userInvoices.map(inv => (
                  <div
                    key={inv.id}
                    className="p-5 bg-card border border-border rounded-xl space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Paid</span>
                        <h4 className="text-sm font-medium text-foreground pt-1">{inv.invoice_number}</h4>
                        <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">Order #{inv.order_id}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-green-600" /> Payment verified
                      </span>
                      <a
                        href={inv.invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-4 bg-secondary border border-border text-sm font-medium text-foreground rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
