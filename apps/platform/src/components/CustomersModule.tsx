import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  ShoppingBag,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  X,
  Loader2,
  Users,
  ChevronRight,
  ShieldAlert,
  ClipboardList,
  DollarSign,
  TrendingUp,
  LayoutGrid,
  List
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { User as Customer, Order } from "../types";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", damping: 22, stiffness: 300 }
  }
};

const drawerVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", damping: 28, stiffness: 300 }
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.25, ease: "easeIn" }
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

// Mini spending bar
function SpendingBar({ amount, max }: { amount: number; max: number }) {
  const percent = max > 0 ? Math.min((amount / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-white/4 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      />
    </div>
  );
}

export default function CustomersModule() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Queries
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => apiRequest<Customer[]>("/admin/customers")
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => apiRequest<Order[]>("/admin/orders")
  });

  // Filter listings
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle user active status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => {
      return apiRequest<Customer>(`/admin/customers/${id}`, "PUT", { is_active });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setSelectedCustomer(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
    }
  });

  const handleToggleActive = (cust: Customer) => {
    toggleStatusMutation.mutate({ id: cust.id, is_active: !cust.is_active });
  };

  const getCustomerOrders = (userId: string) => {
    return orders.filter(o => o.user_id === userId);
  };

  const getCustomerSpending = (userId: string) => {
    return orders.filter(o => o.user_id === userId).reduce((acc, o) => acc + o.total_amount, 0);
  };

  const maxSpending = Math.max(...customers.map(c => getCustomerSpending(c.id)), 1);
  const activeCount = customers.filter(c => c.is_active).length;
  const totalCustomers = customers.length;

  return (
    <motion.div className="space-y-6" initial="hidden" animate="show" variants={containerVariants}>
      {/* Header with stats strip */}
      <motion.div variants={cardVariants} className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Members Directory</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Patient enrollment management and activity monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex items-center bg-white/3 border border-white/6 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === "grid" ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === "list" ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-linear-to-br from-[#121214]/80 to-[#0a0a0c]/90 border border-white/6 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Total Members</p>
            <p className="text-xl font-bold text-white mt-1 tabular-nums">{totalCustomers}</p>
          </div>
          <div className="bg-linear-to-br from-[#121214]/80 to-[#0a0a0c]/90 border border-white/6 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Active</p>
            <p className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">{activeCount}</p>
          </div>
          <div className="bg-linear-to-br from-[#121214]/80 to-[#0a0a0c]/90 border border-white/6 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Suspended</p>
            <p className="text-xl font-bold text-rose-400 mt-1 tabular-nums">{totalCustomers - activeCount}</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={cardVariants} className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search members by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/3 border border-white/6 pl-10 pr-4 py-2.5 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
        />
      </motion.div>

      {/* Members Grid / List */}
      {isLoadingCustomers ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-8 h-8 text-emerald-500" />
          </motion.div>
          <span className="text-xs text-zinc-500">Loading member profiles...</span>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <motion.div
          variants={cardVariants}
          className="text-center py-20 bg-white/2 border border-white/6 rounded-2xl space-y-3"
        >
          <Users className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-sm text-zinc-400">No members found</p>
          <p className="text-xs text-zinc-500">Try adjusting your search query</p>
        </motion.div>
      ) : viewMode === "grid" ? (
        /* === GRID VIEW: Member Cards === */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredCustomers.map((c) => {
            const custOrders = getCustomerOrders(c.id);
            const spending = getCustomerSpending(c.id);
            return (
              <motion.div
                key={c.id}
                variants={cardVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => setSelectedCustomer(c)}
                className="relative group overflow-hidden bg-linear-to-br from-[#121214]/80 to-[#0a0a0c]/90 backdrop-blur-xl border border-white/6 rounded-2xl p-5 cursor-pointer"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br from-emerald-500/5 to-transparent rounded-2xl pointer-events-none" />
                <div className="absolute -top-8 -right-8 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                {/* Status indicator */}
                <div className="absolute top-4 right-4">
                  <span className={`w-2.5 h-2.5 rounded-full block ${c.is_active ? "bg-emerald-400 shadow-lg shadow-emerald-500/40" : "bg-zinc-600"}`} />
                </div>

                {/* Avatar with gradient ring */}
                <div className="relative flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold select-none shrink-0 ${
                    c.is_active
                      ? "bg-linear-to-br from-emerald-600/20 to-teal-600/20 border-2 border-emerald-500/30 text-emerald-400"
                      : "bg-linear-to-br from-zinc-800 to-zinc-900 border-2 border-zinc-700/50 text-zinc-400"
                  }`}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{c.name}</h4>
                    <p className="text-[11px] text-zinc-500 truncate">{c.email}</p>
                  </div>
                </div>

                {/* Spending bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Lifetime Value</span>
                    <span className="text-xs font-bold text-white tabular-nums">${spending.toFixed(2)}</span>
                  </div>
                  <SpendingBar amount={spending} max={maxSpending} />
                </div>

                {/* Footer stats */}
                <div className="flex items-center justify-between pt-3 border-t border-white/4">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <ShoppingBag className="w-3 h-3" />
                    <span className="font-medium">{custOrders.length} orders</span>
                  </div>
                  <span className="text-[10px] text-zinc-600">
                    {new Date(c.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* === LIST VIEW === */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {filteredCustomers.map((c) => {
            const custOrders = getCustomerOrders(c.id);
            const spending = getCustomerSpending(c.id);
            return (
              <motion.div
                key={c.id}
                variants={cardVariants}
                whileHover={{ x: 4 }}
                onClick={() => setSelectedCustomer(c)}
                className="group flex items-center gap-4 bg-linear-to-r from-[#121214]/60 to-transparent border border-white/4 hover:border-white/8 rounded-xl p-4 cursor-pointer transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  c.is_active
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-zinc-800 border border-zinc-700/50 text-zinc-400"
                }`}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white truncate">{c.name}</h4>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">{c.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-xs">
                  <div className="text-right">
                    <p className="text-zinc-500 text-[10px]">Orders</p>
                    <p className="text-white font-semibold">{custOrders.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 text-[10px]">Spent</p>
                    <p className="text-white font-semibold tabular-nums">${spending.toFixed(0)}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Customer Detail Drawer — Animated */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setSelectedCustomer(null)}
            />

            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-lg bg-[#0a0a0c]/95 backdrop-blur-2xl border-l border-white/6 h-full flex flex-col p-6 overflow-y-auto shadow-2xl"
            >
              <div className="space-y-6">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-between pb-4 border-b border-white/6"
                >
                  <div>
                    <h3 className="font-bold text-white text-lg">Member Profile</h3>
                    <span className="text-zinc-500 text-[11px]">ID: {selectedCustomer.id}</span>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>

                {/* Profile card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-linear-to-br from-[#141416] to-[#0e0e10] border border-white/6 rounded-2xl p-6 space-y-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-linear-to-br from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold select-none shadow-lg shadow-emerald-900/20">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{selectedCustomer.name}</h4>
                      <p className="text-zinc-500 text-[11px] mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        Member since {new Date(selectedCustomer.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 border-t border-white/4 pt-4 text-sm">
                    <p className="flex items-center gap-3 text-zinc-300">
                      <Mail className="w-4 h-4 text-zinc-500 shrink-0" /> {selectedCustomer.email}
                    </p>
                    {selectedCustomer.phone && (
                      <p className="flex items-center gap-3 text-zinc-300">
                        <Phone className="w-4 h-4 text-zinc-500 shrink-0" /> {selectedCustomer.phone}
                      </p>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-3 border-t border-white/4 pt-4">
                    <div className="bg-white/2 border border-white/4 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-white tabular-nums">{getCustomerOrders(selectedCustomer.id).length}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Total Orders</p>
                    </div>
                    <div className="bg-white/2 border border-white/4 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-emerald-400 tabular-nums">${getCustomerSpending(selectedCustomer.id).toFixed(2)}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Lifetime Value</p>
                    </div>
                  </div>
                </motion.div>

                {/* Order Timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3"
                >
                  <span className="text-[11px] uppercase font-semibold tracking-wider text-zinc-400 block">Order History</span>

                  {getCustomerOrders(selectedCustomer.id).length === 0 ? (
                    <div className="text-center py-10 bg-white/2 border border-white/4 rounded-xl text-xs text-zinc-600">
                      <ClipboardList className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      No orders yet
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {getCustomerOrders(selectedCustomer.id).map((o, idx) => (
                        <motion.div
                          key={o.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + idx * 0.05 }}
                          className="flex items-center gap-3 p-3.5 bg-white/2 border border-white/4 hover:border-white/8 rounded-xl text-xs transition-colors"
                        >
                          {/* Timeline dot */}
                          <div className="w-2 h-2 rounded-full bg-emerald-400/60 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-zinc-200">Order #EYE-{o.id}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(o.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-white tabular-nums">${o.total_amount.toFixed(2)}</p>
                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-full font-semibold mt-0.5 inline-block ${
                              o.status === "DELIVERED" || o.status === "PAID"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : o.status === "CANCELLED"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {o.status}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Account Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="border-t border-white/6 pt-5 space-y-3"
                >
                  <span className="text-[11px] uppercase font-semibold tracking-wider text-zinc-400 block">Account Management</span>
                  <div className="bg-white/2 border border-white/4 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">Account Status</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 max-w-52">
                        {selectedCustomer.is_active
                          ? "Active — member can place orders"
                          : "Suspended — login and checkout disabled"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleActive(selectedCustomer)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedCustomer.is_active
                          ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20"
                          : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {selectedCustomer.is_active ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
