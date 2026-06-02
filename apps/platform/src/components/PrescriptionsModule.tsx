import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  X,
  FileCheck
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { Prescription } from "../types";

export default function PrescriptionsModule() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  // Fetch prescriptions
  const { data: prescriptions = [], isLoading: isLoadingRx } = useQuery<Prescription[]>({
    queryKey: ["prescriptions"],
    queryFn: () => apiRequest<Prescription[]>("/admin/prescriptions")
  });

  // Verification status update mutation
  const verifyMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: "APPROVED" | "REJECTED"; notes: string }) =>
      apiRequest<Prescription>(`/admin/prescriptions/${id}/status`, "PUT", { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      setSelectedRx(null);
      setReviewNotes("");
      alert("Prescription status successfully verified and updated across database logs.");
    }
  });

  const handleVerify = (id: number, status: "APPROVED" | "REJECTED") => {
    verifyMutation.mutate({ id, status, notes: reviewNotes || `Prescription checked and marked as ${status.toLowerCase()}` });
  };

  // Filter listings
  const filteredRx = prescriptions.filter((r) => {
    const matchesSearch =
      String(r.id).includes(searchTerm) ||
      (r.user_name && r.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.user_email && r.user_email.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Filters block layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by ID, customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121214] border border-border/70 pl-10 pr-4 py-2.5 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-[#10b981]/50 transition-all font-mono"
          />
        </div>

        {/* Tab filters */}
        <div className="flex gap-1.5 font-mono text-xs overflow-x-auto pb-1">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30 font-semibold"
                  : "bg-zinc-900/40 border-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid listing items */}
      {isLoadingRx ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-xs font-mono">Loading prescription verification files...</span>
        </div>
      ) : filteredRx.length === 0 ? (
        <div className="text-center py-20 bg-[#121213]/20 border border-border/40 rounded-xl space-y-3">
          <FileCheck className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-sm font-mono text-zinc-400">Prescription indexes empty</p>
          <p className="text-xs text-zinc-500">No verification files have been uploaded for clinical checks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRx.map((rx) => (
            <div
              key={rx.id}
              id={`prescription-card-${rx.id}`}
              className="bg-[#121214]/50 border border-border/50 rounded-xl overflow-hidden hover:border-[#10b981]/25 transition-all flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                {/* Clinical Check Box head */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-zinc-950 border border-border/70 flex items-center justify-center text-emerald-400">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-bold text-white text-xs font-mono">RX-{rx.id}</span>
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                    rx.status === "APPROVED"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/40"
                      : rx.status === "REJECTED"
                      ? "bg-rose-950/60 text-rose-400 border border-rose-900/40"
                      : "bg-amber-950/60 text-amber-400 border border-amber-900/40"
                  }`}>
                    {rx.status}
                  </span>
                </div>

                {/* Accounts details */}
                <div className="text-xs space-y-1 font-mono">
                  <span className="text-[9px] uppercase font-semibold text-zinc-500 block">Registered Patient</span>
                  <p className="text-zinc-200 font-bold">{rx.user_name || "Alice Vance"}</p>
                  <p className="text-[10px] text-zinc-500">{rx.user_email || "alice@example.com"}</p>
                </div>

                {/* File Attachment thumbnail */}
                <div
                  className="h-32 bg-zinc-950 rounded bg-cover bg-center cursor-pointer relative overflow-hidden group border border-border"
                  style={{ backgroundImage: `url(${rx.file_url})` }}
                  onClick={() => setZoomUrl(rx.file_url)}
                >
                  <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-zinc-300 text-xs font-mono gap-1">
                    <Eye className="w-4 h-4" /> Expand verified files
                  </div>
                </div>

                {/* Review logs text */}
                <div className="bg-[#09090b]/80 border border-border/30 p-3 rounded text-xs font-mono">
                  <span className="text-[9px] uppercase font-semibold text-zinc-500 block mb-1">Physician Review Notes</span>
                  <p className="text-zinc-400 leading-normal line-clamp-2">
                    {rx.notes || "Pendency: awaiting clinician signoff and corrective power verification."}
                  </p>
                </div>
              </div>

              {/* Status Verification buttons */}
              {rx.status === "PENDING" && (
                <div className="p-4 bg-zinc-950 border-t border-border/40">
                  <button
                    onClick={() => { setSelectedRx(rx); setReviewNotes(rx.notes || ""); }}
                    className="w-full bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 hover:border-emerald-500/40 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Clinical Review Audit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog modal overlay */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedRx(null)} />

          <div className="bg-[#0c0c0e] border border-border rounded-xl max-w-md w-full p-6 relative z-10 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold font-mono text-sm text-zinc-200">Clinical Verify Audit: RX-{selectedRx.id}</h3>
              <button onClick={() => setSelectedRx(null)}>
                <X className="w-5 h-5 text-zinc-500 hover:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-mono space-y-1">
                <p className="text-zinc-500">Patient account: <span className="text-zinc-350">{selectedRx.user_name}</span></p>
                <p className="text-zinc-500">Contact: <span className="text-zinc-350">{selectedRx.user_email}</span></p>
              </div>

              {/* Prescription reviewer lines input */}
              <div className="space-y-2 text-xs font-mono">
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#22c55e] block">Verification notes</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Insert sphere index measurements, lens coating limits, and signs of physician signature verification bounds..."
                  className="w-full bg-[#121214] border border-border px-3.5 py-2.5 rounded-lg text-sm text-zinc-350 focus:outline-none"
                />
              </div>

              {/* Verify triggers */}
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => handleVerify(selectedRx.id, "APPROVED")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-lg font-mono cursor-pointer flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Prescription
                </button>
                <button
                  onClick={() => handleVerify(selectedRx.id, "REJECTED")}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 rounded-lg font-mono cursor-pointer flex items-center justify-center gap-1"
                >
                  <XCircle className="w-4 h-4" /> Reject (Faulty)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded File Attachment frame overlay */}
      {zoomUrl && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setZoomUrl(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={zoomUrl}
            alt="Physician Certificate Verification Zoom File"
            referrerPolicy="no-referrer"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg border border-zinc-900"
          />
        </div>
      )}
    </div>
  );
}
