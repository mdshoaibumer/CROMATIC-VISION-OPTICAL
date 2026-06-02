import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronRight,
  Eye,
  Truck,
  CreditCard,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  X,
  ClipboardList
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { Order } from "../types";

export default function OrdersModule() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingCode, setTrackingCode] = useState("");

  // Fetch orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => apiRequest<Order[]>("/admin/orders")
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, tracking }: { id: number; status: string; tracking?: string }) =>
      apiRequest<Order>(`/admin/orders/${id}/status`, "PUT", { status, tracking_number: tracking }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // Update local detailed drawer too
      setSelectedOrder(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
      alert("Order status successfully updated across database ledger.");
    }
  });

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      String(o.id).includes(searchTerm) ||
      (o.user_name && o.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.user_email && o.user_email.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && o.status === statusFilter;
  });

  const handleUpdateStatus = (id: number, newStatus: string) => {
    updateStatusMutation.mutate({
      id,
      status: newStatus,
      tracking: newStatus === "SHIPPED" ? trackingCode || undefined : undefined
    });
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setTrackingCode(order.tracking_number || "");
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-950/50 text-emerald-400 border border-emerald-950";
      case "SHIPPED":
        return "bg-blue-950/50 text-blue-400 border border-blue-950";
      case "PAID":
      case "PROCESSING":
        return "bg-teal-950/50 text-teal-400 border border-teal-950";
      case "PENDING":
        return "bg-amber-950/50 text-amber-400 border border-amber-950";
      case "CANCELLED":
        return "bg-zinc-800/50 text-zinc-400 border border-zinc-800";
      default:
        return "bg-zinc-900 text-zinc-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by order #, account details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#121214] border border-border/70 pl-10 pr-4 py-2.5 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 transition-all font-mono"
            />
          </div>

          {/* Quick tabs filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 font-mono text-xs">
            {["ALL", "PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30 font-semibold"
                    : "bg-zinc-900/40 border-zinc-900 text-zinc-450 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid listing */}
      {isLoadingOrders ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-xs font-mono">Querying transaction log indices...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-[#121213]/20 border border-border/40 rounded-xl space-y-3">
          <ClipboardList className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-sm font-mono text-zinc-400">Order register matches empty</p>
          <p className="text-xs text-zinc-500">Edit keyword criteria or wait for customers to place new eyeglasses orders.</p>
        </div>
      ) : (
        <div className="bg-[#121214]/30 border border-border/50 rounded-xl overflow-hidden shadow-inner">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#121214] text-[10px] uppercase font-bold tracking-widest text-zinc-500 border-b border-border/50 font-mono">
                <tr>
                  <th className="py-4 px-5">Order ID</th>
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5">Buyer</th>
                  <th className="py-4 px-5">Settlement Total</th>
                  <th className="py-4 px-5">Fulfillment Status</th>
                  <th className="py-4 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-zinc-300">
                {filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-[#1c1c20]/25 transition-all cursor-pointer group"
                    onClick={() => openOrderDetails(o)}
                  >
                    <td className="py-4 px-5 font-semibold text-white">#EYE-{o.id}</td>
                    <td className="py-4 px-5 text-xs text-zinc-500">
                      {new Date(o.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-xs">
                        <p className="text-zinc-200 font-bold">{o.user_name || "Alice Vance"}</p>
                        <p className="text-zinc-500 text-[10px] font-mono">{o.user_email || "alice@example.com"}</p>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-bold text-white">${o.total_amount.toFixed(2)}</td>
                    <td className="py-4 px-5">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${getStatusStyle(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button className="p-1 px-2.5 rounded hover:bg-zinc-800 text-zinc-400 group-hover:text-white transition-all cursor-pointer">
                        <ChevronRight className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order detail view drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />

          <div className="relative w-full max-w-lg bg-[#0c0c0e] border-l border-border h-full flex flex-col justify-between p-6 overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base font-mono">Invoice Order Details #EYE-{selectedOrder.id}</h3>
                  <p className="text-zinc-500 text-[11px] font-mono">Registered buyer and optical elements specification payload.</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-950 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Order specifications */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-[#121214] p-3 rounded-lg border border-border/50">
                  <span className="text-[10px] text-zinc-500 uppercase block mb-1">Customer Profile</span>
                  <p className="font-bold text-zinc-200 truncate">{selectedOrder.user_name || "Alice Vance"}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{selectedOrder.user_email || "alice@example.com"}</p>
                </div>
                <div className="bg-[#121214] p-3 rounded-lg border border-border/50">
                  <span className="text-[10px] text-zinc-500 uppercase block mb-1">Fulfilled Timestamp</span>
                  <p className="font-bold text-zinc-200">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="bg-[#121214] p-3.5 rounded-lg border border-border/50 text-xs font-mono flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block mb-1">Shipping Destination Coordinates</span>
                  <p className="text-zinc-300 leading-normal">{selectedOrder.shipping_address || "1428 Elm Street, Springwood, OH 45201"}</p>
                </div>
              </div>

              {/* Items Table details */}
              <div className="space-y-2 border-t border-border/40 pt-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono block">Order Items Cart Ledger</span>
                <div className="bg-zinc-950 rounded-lg border border-border/40 p-1 divide-y divide-border/40">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((it) => (
                      <div key={it.id} className="flex justify-between items-center p-3 text-xs font-mono">
                        <div>
                          <p className="font-bold text-zinc-300">{it.product_name}</p>
                          <p className="text-[10px] text-zinc-500">
                            quantity: {it.quantity} @ ${it.price.toFixed(2)}
                          </p>
                        </div>
                        <span className="font-bold text-white">${(it.quantity * it.price).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-zinc-650 font-mono">No sub-items registered inside cart wrapper.</div>
                  )}
                </div>
              </div>

              {/* Status Update Command Deck */}
              <div className="border-t border-border/40 pt-4 space-y-4 font-mono text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#22c55e] block mb-2">Transition Order Status</span>
                  <div className="grid grid-cols-2 gap-2">
                    {["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                        className={`py-2 px-3 rounded-md text-[11px] font-bold border transition-all text-left flex justify-between items-center cursor-pointer ${
                          selectedOrder.status === st
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                            : "bg-zinc-950 hover:bg-zinc-900 border-zinc-900 text-zinc-400"
                        }`}
                      >
                        <span>{st}</span>
                        {selectedOrder.status === st && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tracking code input triggered when marking as shipped */}
                {selectedOrder.status === "PROCESSING" || selectedOrder.status === "SHIPPED" ? (
                  <div className="bg-zinc-950 p-4 border border-border rounded-lg space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">Provide Shipment tracking details</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. TRACK-EYE-89021"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                        className="bg-[#121214] border border-border px-3 py-2 text-xs rounded text-zinc-350 focus:outline-none focus:border-blue-500 flex-1"
                      />
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.id, "SHIPPED")}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white text-xs font-bold cursor-pointer"
                      >
                        Apply Track Codes
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
