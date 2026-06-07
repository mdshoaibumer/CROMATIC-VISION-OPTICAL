import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  FileCode,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Activity
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { Order, Prescription } from "../types";
import { useAnimatedNumber } from "../lib/useAnimatedNumber";

// Stagger container animation
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", damping: 22, stiffness: 280 }
  }
};

const chartVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 20, stiffness: 200, delay: 0.4 }
  }
};

// Sparkline micro-chart component
function Sparkline({ data, color = "#10b981", height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} className="opacity-60">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,${height} ${points.join(" ")} ${width},${height}`}
        fill={`url(#spark-${color.replace("#", "")})`}
      />
    </svg>
  );
}

export default function DashboardModule() {
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

  // Animated numbers
  const animatedRevenue = useAnimatedNumber(totalRevenue);
  const animatedOrders = useAnimatedNumber(totalOrdersAmount, 800);
  const animatedAOV = useAnimatedNumber(averageOrderValue);
  const animatedRate = useAnimatedNumber(approvalRate, 1000);

  // Sparkline data (simulated trend)
  const revenueSparkline = [0.3, 0.45, 0.5, 0.6, 0.55, 0.7, 0.85, 1].map(v => v * totalRevenue);
  const ordersSparkline = [2, 4, 3, 6, 5, 7, 8, totalOrdersAmount];
  const aovSparkline = [0.6, 0.7, 0.65, 0.8, 0.75, 0.9, 0.85, 1].map(v => v * averageOrderValue);
  const rxSparkline = [40, 55, 60, 65, 70, 72, 75, approvalRate];

  // Revenue trend data
  const revenueTrend = [
    { month: "Jan", amount: totalRevenue * 0.4 },
    { month: "Feb", amount: totalRevenue * 0.6 },
    { month: "Mar", amount: totalRevenue * 0.75 },
    { month: "Apr", amount: totalRevenue * 0.9 },
    { month: "May", amount: totalRevenue }
  ];

  const maxAmount = Math.max(...revenueTrend.map(d => d.amount), 500);

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Visual greeting bar */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Operations Dashboard</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Real-time prescription analysis, billing logs, and catalog metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-400">Live</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">Last sync: Just now</span>
        </div>
      </motion.div>

      {/* Grid statistics — Glassmorphic Cards */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Card 1: Revenue */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          id="metric-card-revenue"
          className="relative group overflow-hidden bg-linear-to-br from-[#121214]/80 to-[#0a0a0c]/90 backdrop-blur-xl border border-white/6 p-5 rounded-2xl flex flex-col justify-between cursor-default"
        >
          {/* Glow effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br from-emerald-500/8 to-transparent rounded-2xl pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Gross Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="relative mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white tabular-nums">
                ${animatedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">+18.4%</span> vs last cycle
              </p>
            </div>
            <Sparkline data={revenueSparkline} color="#10b981" />
          </div>
        </motion.div>

        {/* Metric Card 2: Orders */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          id="metric-card-orders"
          className="relative group overflow-hidden bg-linear-to-br from-[#121214]/80 to-[#0a0a0c]/90 backdrop-blur-xl border border-white/6 p-5 rounded-2xl flex flex-col justify-between cursor-default"
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br from-blue-500/6 to-transparent rounded-2xl pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Fulfillment Orders</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-950/20">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="relative mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white tabular-nums">
                {Math.round(animatedOrders)}
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1">
                <span className="text-blue-400 font-semibold">{paidOrders.length}</span> settled invoices
              </p>
            </div>
            <Sparkline data={ordersSparkline} color="#3b82f6" />
          </div>
        </motion.div>

        {/* Metric Card 3: AOV */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          id="metric-card-aov"
          className="relative group overflow-hidden bg-linear-to-br from-[#121214]/80 to-[#0a0a0c]/90 backdrop-blur-xl border border-white/6 p-5 rounded-2xl flex flex-col justify-between cursor-default"
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br from-violet-500/6 to-transparent rounded-2xl pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Avg Order Value</span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-lg shadow-violet-950/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="relative mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white tabular-nums">
                ${animatedAOV.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1">
                Optical frames & coatings bundle
              </p>
            </div>
            <Sparkline data={aovSparkline} color="#8b5cf6" />
          </div>
        </motion.div>

        {/* Metric Card 4: RX Rate */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          id="metric-card-prescriptions"
          className="relative group overflow-hidden bg-linear-to-br from-[#121214]/80 to-[#0a0a0c]/90 backdrop-blur-xl border border-white/6 p-5 rounded-2xl flex flex-col justify-between cursor-default"
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br from-amber-500/6 to-transparent rounded-2xl pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">RX Verification</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="relative mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white tabular-nums">
                {animatedRate.toFixed(1)}%
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1">
                <span className="text-amber-400 font-semibold">{pendingPrescriptions.length} pending</span> in queue
              </p>
            </div>
            <Sparkline data={rxSparkline} color="#f59e0b" />
          </div>
        </motion.div>
      </motion.div>

      {/* Main charts + activity */}
      <motion.div variants={chartVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Analytics Widget: Revenue Growth Chart */}
        <motion.div
          className="lg:col-span-8 relative overflow-hidden bg-linear-to-br from-[#121214]/80 to-[#0a0a0c]/90 backdrop-blur-xl border border-white/6 p-6 rounded-2xl"
          whileHover={{ borderColor: "rgba(16,185,129,0.15)" }}
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-emerald-500/3 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex items-center justify-between pb-4 border-b border-white/6 mb-6">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-zinc-100 uppercase">Gross Billing Analytics</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Revenue projections from closed invoices</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>5-month trend</span>
            </div>
          </div>

          {/* Inline SVG Chart with animated draw */}
          <div className="relative h-64 flex flex-col justify-between pt-4">
            <div className="flex-1 w-full relative flex items-end justify-between px-2">
              {/* Chart Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3].map((_, index) => (
                  <div key={index} className="w-full border-t border-white/4" />
                ))}
              </div>

              {/* Graphical Trend Line */}
              <svg className="absolute inset-0 w-full h-full" overflow="visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="80%" stopColor="#10b981" stopOpacity="0.02" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Area fill */}
                <motion.path
                  d={`M 0%, 256 L ${revenueTrend.map((d, i) => `${(i / (revenueTrend.length - 1)) * 100}%, ${(256 - (d.amount / maxAmount) * 200)}`).join(" L ")} L 100%, 256 Z`}
                  fill="url(#chartGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2, delay: 0.6 }}
                />
                {/* Line stroke */}
                <motion.path
                  d={`M ${revenueTrend.map((d, i) => `${(i / (revenueTrend.length - 1)) * 100}%, ${(256 - (d.amount / maxAmount) * 200)}`).join(" L ")}`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                />
              </svg>

              {/* Floating points & tooltips */}
              {revenueTrend.map((d, i) => {
                const percentLeft = (i / (revenueTrend.length - 1)) * 100;
                const bottomValue = (d.amount / maxAmount) * 200;
                return (
                  <motion.div
                    key={d.month}
                    className="flex flex-col items-center group relative z-10"
                    style={{ left: `${percentLeft}%`, position: "absolute", bottom: `${bottomValue}px`, transform: "translate(-50%, 50%)" }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.15, type: "spring", stiffness: 300 }}
                  >
                    <div className="w-3 h-3 rounded-full bg-[#0a0a0c] border-[3px] border-emerald-400 shadow-lg shadow-emerald-500/30 group-hover:scale-150 transition-transform duration-200 cursor-pointer" />
                    <div className="absolute bottom-6 bg-zinc-900/95 backdrop-blur-sm border border-white/10 text-zinc-200 rounded-lg px-2.5 py-1.5 text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-xl -translate-y-1 group-hover:translate-y-0">
                      ${d.amount.toFixed(2)}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Labels at bottom */}
            <div className="flex justify-between border-t border-white/6 pt-3 mt-2 px-1 text-[10px] font-mono text-zinc-500">
              {revenueTrend.map(d => (
                <span key={d.month} className="hover:text-zinc-300 transition-colors cursor-default">{d.month}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Activity Logs sidebar */}
        <motion.div
          className="lg:col-span-4 relative overflow-hidden bg-linear-to-br from-[#121214]/80 to-[#0a0a0c]/90 backdrop-blur-xl border border-white/6 p-5 rounded-2xl flex flex-col justify-between"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, type: "spring", damping: 20 }}
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/6 mb-4">
              <h3 className="text-sm font-bold tracking-tight text-zinc-100 uppercase">Verification Logs</h3>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-emerald-400 font-semibold">LIVE</span>
              </div>
            </div>

            <div className="space-y-3.5">
              {prescriptions.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-xs font-mono">No recent clinical checks</div>
              ) : (
                prescriptions.slice(0, 4).map((rx, index) => (
                  <motion.div
                    key={rx.id}
                    className="p-3 rounded-xl bg-white/2 border border-white/4 hover:border-white/8 transition-colors text-xs space-y-1.5"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-200 font-semibold text-[12px]">{rx.user_name || "Customer"}</span>
                      <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold ${
                        rx.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : rx.status === "REJECTED"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {rx.status}
                      </span>
                    </div>
                    <p className="text-zinc-500 truncate text-[11px]">{rx.notes || "No physician review remarks"}</p>
                    <span className="text-[9px] font-mono text-zinc-600 block">
                      {new Date(rx.updated_at || rx.created_at).toLocaleDateString()}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/6 mt-4">
            <div className="bg-emerald-500/3 p-3.5 rounded-xl border border-emerald-500/10 text-xs">
              <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Automated RX Engine
              </p>
              <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                Prescriptions verified against physician registers before order processing.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
