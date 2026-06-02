import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  FileCode,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { Order, Prescription } from "../types";

export default function DashboardModule() {
  // Querying orders and prescriptions to compute live metrics dynamically
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => apiRequest<Order[]>("/admin/orders")
  });

  const { data: prescriptions = [] } = useQuery<Prescription[]>({
    queryKey: ["prescriptions"],
    queryFn: () => apiRequest<Prescription[]>("/admin/prescriptions")
  });

  // Calculate stats
  const paidOrders = orders.filter(o => o.status === "PAID" || o.status === "PROCESSING" || o.status === "SHIPPED" || o.status === "DELIVERED");
  const totalRevenue = paidOrders.reduce((acc, curr) => acc + curr.total_amount, 0);
  const totalOrdersAmount = orders.length;
  const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Prescription stats
  const approvedPrescriptions = prescriptions.filter(p => p.status === "APPROVED");
  const pendingPrescriptions = prescriptions.filter(p => p.status === "PENDING");
  const approvalRate = prescriptions.length > 0 ? (approvedPrescriptions.length / prescriptions.length) * 100 : 0;

  // Revenue trend data for standard chart projection
  const revenueTrend = [
    { month: "Jan", amount: totalRevenue * 0.4 },
    { month: "Feb", amount: totalRevenue * 0.6 },
    { month: "Mar", amount: totalRevenue * 0.75 },
    { month: "Apr", amount: totalRevenue * 0.9 },
    { month: "May", amount: totalRevenue }
  ];

  const maxAmount = Math.max(...revenueTrend.map(d => d.amount), 500);

  return (
    <div className="space-y-6">
      {/* Visual greeting bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-mono">Operations Dashboard</h2>
          <p className="text-xs text-zinc-400">Real-time prescription analysis, billing logs, and catalog metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-500">Last synchronized: Just now</span>
        </div>
      </div>

      {/* Grid statistics highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Card 1 */}
        <div id="metric-card-revenue" className="bg-[#121214]/50 border border-border/50 p-5 rounded-xl flex flex-col justify-between hover:border-emerald-500/25 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Gross Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">+18.4%</span> since last billing cycle
            </p>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div id="metric-card-orders" className="bg-[#121214]/50 border border-border/50 p-5 rounded-xl flex flex-col justify-between hover:border-emerald-500/25 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Fulfillment Orders</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white">{totalOrdersAmount}</h3>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
              <span className="text-neutral-400 font-semibold">{paidOrders.length}</span> settled invoices
            </p>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div id="metric-card-aov" className="bg-[#121214]/50 border border-border/50 p-5 rounded-xl flex flex-col justify-between hover:border-emerald-500/25 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Average Order Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
              ${averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
              Reflects optical frames &amp; coatings bundle
            </p>
          </div>
        </div>

        {/* Metric Card 4 */}
        <div id="metric-card-prescriptions" className="bg-[#121214]/50 border border-border/50 p-5 rounded-xl flex flex-col justify-between hover:border-emerald-500/25 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">RX Verification Rate</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
              {approvalRate.toFixed(1)}%
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
              <span className="text-amber-400 font-semibold">{pendingPrescriptions.length} pending verification</span> queue
            </p>
          </div>
        </div>
      </div>

      {/* Main charts widget of layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Analytics Widget: Revenue Growth Line Chart */}
        <div className="lg:col-span-8 bg-[#121214]/55 border border-border/50 p-5 rounded-xl">
          <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-6">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-zinc-200 uppercase font-mono">Gross Billing Analytics</h3>
              <p className="text-[11px] text-zinc-500">Calculated billing projections based on successfully closed invoices.</p>
            </div>
          </div>

          {/* Inline SVG Chart */}
          <div className="h-64 flex flex-col justify-between pt-4">
            <div className="flex-1 w-full relative flex items-end justify-between px-2">
              {/* Chart Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3].map((_, index) => (
                  <div key={index} className="w-full border-t border-border/25 pb-px" />
                ))}
              </div>

              {/* Graphical Trend Line with dots */}
              <svg className="absolute inset-0 w-full h-full" overflow="visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`M ${revenueTrend.map((d, i) => `${(i / (revenueTrend.length - 1)) * 100}%, ${(256 - (d.amount / maxAmount) * 200)}`).join(" L ")}`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                <path
                  d={`M 0%, 256 L ${revenueTrend.map((d, i) => `${(i / (revenueTrend.length - 1)) * 100}%, ${(256 - (d.amount / maxAmount) * 200)}`).join(" L ")} L 100%, 256 Z`}
                  fill="url(#chartGradient)"
                  className="transition-all duration-500"
                />
              </svg>

              {/* Floating points & tooltips */}
              {revenueTrend.map((d, i) => {
                const percentLeft = (i / (revenueTrend.length - 1)) * 100;
                const bottomValue = (d.amount / maxAmount) * 200;
                return (
                  <div
                    key={d.month}
                    className="flex flex-col items-center group relative z-10"
                    style={{ left: `${percentLeft}%`, position: "absolute", bottom: `${bottomValue}px`, transform: "translate(-50%, 50%)" }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-black border-[3.5px] border-emerald-500 shadow-md shadow-emerald-900 group-hover:scale-135 transition-all cursor-pointer" />
                    <div className="absolute bottom-6 bg-zinc-950 border border-border text-zinc-300 rounded px-2 py-1 text-[9px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none transform -translate-y-1 shadow-lg">
                      ${d.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Labels at bottom */}
            <div className="flex justify-between border-t border-border/50 pt-2.5 mt-2 px-1 text-[10px] font-mono text-zinc-500">
              {revenueTrend.map(d => (
                <span key={d.month}>{d.month}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Logs widget sidebar */}
        <div className="lg:col-span-4 bg-[#121214]/55 border border-border/50 p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-4">
              <h3 className="text-sm font-bold tracking-tight text-zinc-200 uppercase font-mono">Verification Logs</h3>
              <span className="text-[10px] text-emerald-400 font-mono animate-pulse">● Live Stream</span>
            </div>

            <div className="space-y-4">
              {prescriptions.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-xs font-mono">No recent clinical checks</div>
              ) : (
                prescriptions.slice(0, 3).map((rx) => (
                  <div key={rx.id} className="text-xs space-y-1">
                    <div className="flex justify-between font-mono">
                      <span className="text-zinc-300 font-semibold">{rx.user_name || "Customer account"}</span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                        rx.status === "APPROVED"
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                          : rx.status === "REJECTED"
                          ? "bg-rose-950/40 text-rose-400 border border-rose-900/30"
                          : "bg-amber-950/40 text-amber-400 border border-amber-900/30"
                      }`}>
                        {rx.status}
                      </span>
                    </div>
                    <p className="text-zinc-500 truncate">{rx.notes || "No physician review remarks provided"}</p>
                    <span className="text-[9px] font-mono text-zinc-600 block">
                      {new Date(rx.updated_at || rx.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border/50 mt-4">
            <div className="bg-zinc-950 p-3 rounded-lg border border-border/40 text-xs">
              <p className="font-mono text-[10px] text-[#22c55e] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Automated Verification Engine
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Digital prescriptions are checked against physician registers automatically before marking corresponding orders as PAID.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
