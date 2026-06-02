import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Download,
  FileText,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  X,
  Printer,
  Receipt
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { Invoice, Order } from "../types";

export default function InvoicesModule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Queries
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => apiRequest<Invoice[]>("/admin/invoices")
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => apiRequest<Order[]>("/admin/orders")
  });

  // Calculate stats
  const totalBilled = invoices.length * 158.50; // Average billing projection when loading empty

  // Filter listings
  const filteredInvoices = invoices.filter((inv) => {
    return (
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(inv.order_id).includes(searchTerm)
    );
  });

  const getOrderTotal = (orderId: number) => {
    const o = orders.find(ord => ord.id === orderId);
    return o ? o.total_amount : 189.99;
  };

  const getOrderDetails = (orderId: number) => {
    return orders.find(ord => ord.id === orderId);
  };

  // Triggers downloading
  const handleDownloadInvoice = (inv: Invoice) => {
    // Generate route path directly targeting our Fiber admin invoice download
    const url = `/api/v1/admin/invoices/${inv.id}/download`;
    console.log(`Triggering invoice download path: ${url}`);

    // Create virtual temporary linkage download element
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = `${inv.invoice_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Search block layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search invoices by code, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121214] border border-border/70 pl-10 pr-4 py-2.5 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 transition-all font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg font-mono text-[11px] text-emerald-400">
          <DollarSign className="w-4.5 h-4.5" /> Total Billed Ledger: ${invoices.reduce((sum, current) => sum + getOrderTotal(current.order_id), 0).toFixed(2)}
        </div>
      </div>

      {/* Main Grid display Invoices */}
      {isLoadingInvoices ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-xs font-mono">Compiling financial billing logs...</span>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-20 bg-[#121213]/20 border border-border/40 rounded-xl space-y-3">
          <Receipt className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-sm font-mono text-zinc-400">Invoice ledger indices empty</p>
          <p className="text-xs text-zinc-500">Invoices get generated dynamically automatically once a customer checkout order gets marked as PAID.</p>
        </div>
      ) : (
        <div className="bg-[#121214]/30 border border-border/50 rounded-xl overflow-hidden shadow-inner">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#121214] text-[10px] uppercase font-bold tracking-widest text-zinc-500 border-b border-border/50  font-mono">
                <tr>
                  <th className="py-4 px-5">Invoice Number</th>
                  <th className="py-4 px-5">Target Order ID</th>
                  <th className="py-4 px-5">Generation Date</th>
                  <th className="py-4 px-5">Billed Gross</th>
                  <th className="py-4 px-5">Verification Stat</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-zinc-300">
                {filteredInvoices.map((inv) => {
                  const billTotal = getOrderTotal(inv.order_id);
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-[#1c1c20]/25 transition-all text-xs cursor-pointer group"
                      onClick={() => setPreviewInvoice(inv)}
                    >
                      <td className="py-4 px-5 font-bold text-white flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" /> {inv.invoice_number}
                      </td>
                      <td className="py-4 px-5 text-zinc-400">#EYE-{inv.order_id}</td>
                      <td className="py-4 px-5 text-zinc-500">
                        {new Date(inv.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-4 px-5 font-bold text-zinc-100">${billTotal.toFixed(2)}</td>
                      <td className="py-4 px-5">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownloadInvoice(inv)}
                            className="p-1 px-2 text-[10.5px] bg-[#121214]/65 border border-border hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-400 rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-97"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Details simulation popup preview sheet */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewInvoice(null)} />

          <div className="bg-[#0c0c0e] border border-border rounded-xl max-w-md w-full p-6 relative z-10 space-y-6 font-mono text-xs text-zinc-300 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Invoice {previewInvoice.invoice_number}</h3>
                <span className="text-[9px] text-zinc-600 block mt-0.5">Hash ref: {previewInvoice.id}</span>
              </div>
              <button onClick={() => setPreviewInvoice(null)}>
                <X className="w-5 h-5 text-zinc-500 hover:text-white cursor-pointer" />
              </button>
            </div>

            {/* Simulated PDF Layout mapping */}
            <div className="bg-black/40 border border-zinc-900 rounded-lg p-5 font-mono text-[10.5px] space-y-4 shadow-inner text-neutral-300 max-h-[420px] overflow-y-auto">
              {/* Logo block */}
              <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                <div>
                  <h4 className="font-bold text-white text-xs uppercase text-emerald-400">Cromatic Vision Optical</h4>
                  <p className="text-zinc-500 text-[9px] mt-0.5">3000 Clean Arch Port, Sandbox</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{previewInvoice.invoice_number}</p>
                  <p className="text-zinc-500 text-[9px]">Date: {new Date(previewInvoice.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Patient client target details */}
              <div className="space-y-1">
                <span className="text-[8px] text-zinc-500 uppercase block font-semibold mb-1">Bill To Client</span>
                <p className="font-bold text-zinc-100">{getOrderDetails(previewInvoice.order_id)?.user_name || "Unknown Patient"}</p>
                <p className="text-zinc-400 leading-normal">{getOrderDetails(previewInvoice.order_id)?.user_email || "No email recorded"}</p>
                <p className="text-zinc-500 leading-tight block truncate">{getOrderDetails(previewInvoice.order_id)?.shipping_address || "No shipping address recorded"}</p>
              </div>

              {/* Items listing */}
              <div className="border-t border-zinc-900 pt-3 space-y-1.5">
                <div className="flex justify-between text-zinc-600 border-b border-zinc-950 pb-1 text-[9px]">
                  <span>Description Item</span>
                  <span>Total price</span>
                </div>
                {getOrderDetails(previewInvoice.order_id)?.items?.map(it => (
                  <div key={it.id} className="flex justify-between font-mono text-[10px]">
                    <span className="text-zinc-300">{it.product_name} x {it.quantity}</span>
                    <span className="text-zinc-100 font-bold">${(it.quantity * it.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Calculation totals */}
              <div className="border-t border-zinc-900 pt-3 flex justify-between items-center text-xs font-mono font-bold text-white">
                <span className="text-zinc-500">Gross Total Settle Amount:</span>
                <span className="text-emerald-400 font-mono">${getOrderTotal(previewInvoice.order_id).toFixed(2)}</span>
              </div>
            </div>

            {/* Options */}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => handleDownloadInvoice(previewInvoice)}
                className="flex-1 bg-linear-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs py-2.5 rounded-lg font-mono cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download PDF Archive
              </button>
              <button
                onClick={() => window.print()}
                className="bg-zinc-900 border border-border hover:border-zinc-700 text-zinc-400 hover:text-white px-4 py-2.5 rounded-lg cursor-pointer"
                title="Print Receipt"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
