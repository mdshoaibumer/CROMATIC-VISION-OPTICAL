import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  ClipboardList
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { User as Customer, Order } from "../types";

export default function CustomersModule() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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

  // Toggle user active status simulation mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => {
      return apiRequest<Customer>(`/admin/customers/${id}`, "PUT", { is_active });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setSelectedCustomer(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
      alert("Customer profile status flag was toggled successfully.");
    }
  });

  const handleToggleActive = (cust: Customer) => {
    toggleStatusMutation.mutate({ id: cust.id, is_active: !cust.is_active });
  };

  const getCustomerOrders = (userId: string) => {
    return orders.filter(o => o.user_id === userId);
  };

  return (
    <div className="space-y-6">
      {/* Search block layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search patients by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121214] border border-border/70 pl-10 pr-4 py-2.5 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-[#10b981]/50 transition-all font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg font-mono text-[11px] text-emerald-400">
          <Users className="w-4.5 h-4.5 animate-pulse" /> Active Verified Patient accounts: {customers.filter(c => c.is_active).length}
        </div>
      </div>

      {/* Grid listing customers */}
      {isLoadingCustomers ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-xs font-mono">Loading patient profile rosters...</span>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-20 bg-[#121213]/20 border border-border/40 rounded-xl space-y-3">
          <Users className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-sm font-mono text-zinc-400">Rosters match indices empty</p>
          <p className="text-xs text-zinc-500">Wait for users to complete register entries or verify your spelling indices.</p>
        </div>
      ) : (
        <div className="bg-[#121214]/30 border border-border/50 rounded-xl overflow-hidden shadow-inner">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#121214] text-[10px] uppercase font-bold tracking-widest text-zinc-500 border-b border-border/50 font-mono">
                <tr>
                  <th className="py-4 px-5">Patient Name</th>
                  <th className="py-4 px-5">Contact Details</th>
                  <th className="py-4 px-5">Registration Date</th>
                  <th className="py-4 px-5">Orders Placed</th>
                  <th className="py-4 px-5">Verification Code</th>
                  <th className="py-4 px-5 text-right">Audits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-zinc-300">
                {filteredCustomers.map((c) => {
                  const custOrders = getCustomerOrders(c.id);
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#1c1c20]/25 transition-all cursor-pointer group"
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <td className="py-4 px-5 font-bold text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs select-none">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        {c.name}
                      </td>
                      <td className="py-4 px-5">
                        <div className="text-xs space-y-0.5">
                          <p className="text-zinc-300 font-medium flex items-center gap-1">
                            <Mail className="w-3 h-3 text-zinc-500" /> {c.email}
                          </p>
                          {c.phone && (
                            <p className="text-zinc-500 text-[10.5px] flex items-center gap-1">
                              <Phone className="w-3 h-3 text-zinc-650" /> {c.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-zinc-500">
                        {new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="py-4 px-5 font-bold text-zinc-100">{custOrders.length} orders</td>
                      <td className="py-4 px-5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleActive(c); }}
                          className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer transition-all ${
                            c.is_active
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/35 hover:bg-emerald-950/60"
                              : "bg-rose-950/40 text-rose-450 border-rose-900/35 hover:bg-rose-950/60"
                          }`}
                        >
                          {c.is_active ? "● PATIENT ENROLLED" : "○ ACCOUNT SUSPENDED"}
                        </button>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button className="p-1 px-2 text-xs rounded hover:bg-zinc-800 text-zinc-400 group-hover:text-white cursor-pointer transition-all">
                          <ChevronRight className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer summary analysis sheets */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />

          <div className="relative w-full max-w-lg bg-[#0c0c0e] border-l border-border h-full flex flex-col justify-between p-6 overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base font-mono">Patient Enrollment Audit</h3>
                  <span className="text-zinc-650 text-[10px] font-mono">Unique Key ID: {selectedCustomer.id}</span>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-950 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bio block card */}
              <div className="bg-[#121214] border border-border/55 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-tr from-emerald-900 to-teal-950 border border-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg font-bold select-none shadow-md shadow-emerald-950/40">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="font-mono">
                    <h4 className="font-bold text-zinc-100 text-sm leading-tight">{selectedCustomer.name}</h4>
                    <p className="text-zinc-500 text-[11px] mt-0.5">Enrolled paciente since {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-border/40 pt-4 text-xs font-mono text-zinc-355">
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-zinc-500 shrink-0" /> {selectedCustomer.email}</p>
                  {selectedCustomer.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-zinc-500 shrink-0" /> {selectedCustomer.phone}</p>}
                </div>
              </div>

              {/* Patient past orders list */}
              <div className="space-y-3.5 border-t border-border/45 pt-4 font-mono">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">Historic order ledger</span>

                {getCustomerOrders(selectedCustomer.id).length === 0 ? (
                  <div className="text-center py-10 bg-zinc-950 rounded-lg border border-zinc-900/40 text-xs text-zinc-600">
                    <ClipboardList className="w-6 h-6 mx-auto mb-1 opacity-25" />
                    No orders associated with this patient account
                  </div>
                ) : (
                  <div className="space-y-3 max-h-75 overflow-y-auto pr-1">
                    {getCustomerOrders(selectedCustomer.id).map((o) => (
                      <div
                        key={o.id}
                        className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-900 flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold text-zinc-300">Order #EYE-{o.id}</p>
                          <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1.5 leading-none">
                            <Calendar className="w-3 h-3 text-zinc-500" /> {new Date(o.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">${o.total_amount.toFixed(2)}</p>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 mt-1 block border border-zinc-800">
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enrollment toggle button action inside drawer */}
              <div className="border-t border-border/40 pt-4 font-mono text-xs space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#22c55e] block">Account Enrollment Audit flags</span>
                <div className="bg-zinc-950 p-4 rounded-lg border border-border/40 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-zinc-300">Active status indicator</p>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-normal max-w-60">
                      Suspend accounts to restrict order checkouts or disable login access instantly.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleActive(selectedCustomer)}
                    className={`px-3 py-2 rounded text-xs font-bold border transition-all cursor-pointer font-mono ${
                      selectedCustomer.is_active
                        ? "bg-rose-950/20 hover:bg-rose-950/40 text-rose-500 border-rose-900/30"
                        : "bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border-emerald-900/30"
                    }`}
                  >
                    {selectedCustomer.is_active ? "Suspend Account" : "Activate Account"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
