import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  PlusCircle,
  EyeOff,
  ShoppingBag,
  ArrowRight,
  Loader2
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { Product, Category, ProductImage } from "../types";

// Validation schema
const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category_id: z.coerce.number().min(1, "Please select a category"),
  price: z.coerce.number().min(0.01, "Price must be at least $0.01"),
  stock: z.coerce.number().min(0, "Stock cannot be negative"),
  status: z.enum(["active", "inactive"]),
  description: z.string().optional()
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductsModule() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [imageUploadUrl, setImageUploadUrl] = useState("");

  // Fetch products and categories
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => apiRequest<Product[]>("/admin/products")
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiRequest<Category[]>("/admin/categories")
  });

  // Setup form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<any>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      category_id: 0,
      price: 0,
      stock: 0,
      status: "active",
      description: ""
    }
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: (values: ProductFormValues) => apiRequest<Product>("/admin/products", "POST", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      handleCloseForm();
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: ProductFormValues }) =>
      apiRequest<Product>(`/admin/products/${id}`, "PUT", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      handleCloseForm();
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest<any>(`/admin/products/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, newStock }: { id: number; newStock: number }) =>
      apiRequest<Product>(`/admin/products/${id}`, "PUT", { stock: newStock }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, imageUrl }: { id: number; imageUrl: string }) => {
      // Direct asset url injection
      return apiRequest<ProductImage>(`/admin/products/${id}/images`, "POST", { image_url: imageUrl, is_primary: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setImageUploadUrl("");
    }
  });

  // Event handlers
  const handleOpenCreateForm = () => {
    setIsEditing(false);
    setEditingProduct(null);
    reset({
      name: "",
      category_id: categories.length > 0 ? categories[0].id : 0,
      price: 0,
      stock: 0,
      status: "active",
      description: ""
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (productsModel: Product) => {
    setIsEditing(true);
    setEditingProduct(productsModel);
    reset({
      name: productsModel.name,
      category_id: productsModel.category_id || 0,
      price: productsModel.price,
      stock: productsModel.stock,
      status: productsModel.status,
      description: productsModel.description || ""
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    reset();
  };

  const onFormSubmit = (values: ProductFormValues) => {
    if (isEditing && editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, values });
    } else {
      createProductMutation.mutate(values);
    }
  };

  const handleIncrementStock = (p: Product, offset: number) => {
    const final = Math.max(0, p.stock + offset);
    stockMutation.mutate({ id: p.id, newStock: final });
  };

  const handleUploadImage = (pId: number) => {
    if (!imageUploadUrl.trim()) return;
    uploadImageMutation.mutate({ id: pId, imageUrl: imageUploadUrl });
  };

  // Filtering products
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category_name && p.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search and Top command line bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search items by name, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121214] border border-border/70 pl-10 pr-4 py-2.5 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 transition-all font-mono"
          />
        </div>

        <button
          onClick={handleOpenCreateForm}
          id="btn-add-product"
          className="flex items-center justify-center gap-2 bg-linear-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs px-4 py-3 rounded-lg font-mono transition-all duration-200 shadow-md shadow-emerald-950/20 active:scale-97 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Optical Item
        </button>
      </div>

      {/* Main Grid displaying Products */}
      {isLoadingProducts ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-xs font-mono">Loading inventory ledger details...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-24 bg-[#121213]/20 border border-border/40 rounded-xl space-y-3">
          <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-sm font-mono text-zinc-400">Inventory match indices empty</p>
          <p className="text-xs text-zinc-500">Edit filters or add a new optical eyeglasses pair to build the database catalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const primaryImage = p.images?.find(i => i.is_primary)?.image_url ||
              ((p.images && p.images.length > 0) ? p.images[0].image_url : null);

            return (
              <div
                key={p.id}
                id={`product-card-${p.id}`}
                className="bg-[#121214]/50 border border-border/60 rounded-xl overflow-hidden hover:border-[#10b981]/30 transition-all flex flex-col justify-between"
              >
                {/* Media area */}
                <div className="h-44 bg-zinc-900 border-b border-border/30 relative overflow-hidden group">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                      <Image className="w-8 h-8 opacity-40" />
                      <span className="text-[10px] font-mono uppercase tracking-wider">No Catalog Asset</span>
                    </div>
                  )}

                  {/* Status chip */}
                  <span className={`absolute top-3 right-3 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${
                    p.status === "active"
                      ? "bg-emerald-950/80 text-emerald-400 border-emerald-900/40"
                      : "bg-border/80 text-zinc-400 border-[#3f3f46]/40"
                  }`}>
                    {p.status}
                  </span>

                  {/* Category overlay label */}
                  {p.category_name && (
                    <span className="absolute bottom-3 left-3 bg-black/85 text-zinc-300 text-[10px] uppercase font-bold tracking-widest px-2 py-0.7 rounded font-mono border border-zinc-800/80">
                      {p.category_name}
                    </span>
                  )}
                </div>

                {/* Content Panel */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-zinc-100 text-sm font-mono truncate" title={p.name}>
                        {p.name}
                      </h3>
                      <span className="text-zinc-200 font-mono font-bold text-xs shrink-0">
                        ${p.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 h-8 leading-normal">
                      {p.description || "Premium spectacles featuring custom prescriptions, built with resilient mechanical durability."}
                    </p>
                  </div>

                  {/* Stock handling section */}
                  <div className="bg-zinc-950/45 border border-zinc-905 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Stock Control Ledger</span>
                      <span className={`text-xs font-mono font-bold ${p.stock === 0 ? "text-rose-500" : p.stock < 10 ? "text-amber-500" : "text-emerald-400"}`}>
                        {p.stock === 0 ? "OUT OF STOCK" : `${p.stock} units`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleIncrementStock(p, -1)}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-850 px-2.5 py-1.5 rounded text-[11px] font-mono text-zinc-400 hover:text-white transition-all cursor-pointer border border-border/30"
                      >
                        -1 Write
                      </button>
                      <button
                        onClick={() => handleIncrementStock(p, 5)}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-850 px-2.5 py-1.5 rounded text-[11px] font-mono text-zinc-400 hover:text-white transition-all cursor-pointer border border-border/30"
                      >
                        +5 Stock
                      </button>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1 w-full">
                      {editingProduct?.id === p.id ? (
                        <div className="flex items-center gap-1.5 w-full bg-zinc-950 p-1.5 rounded border border-border">
                          <input
                            type="text"
                            placeholder="Image URL"
                            value={imageUploadUrl}
                            onChange={(e) => setImageUploadUrl(e.target.value)}
                            className="bg-[#121214] border border-border px-2 py-1 text-[10px] rounded text-zinc-300 w-full focus:outline-none focus:border-teal-500 font-mono"
                          />
                          <button
                            onClick={() => handleUploadImage(p.id)}
                            className="bg-teal-600 hover:bg-teal-500 px-2 py-1 rounded text-[10px] text-white font-mono cursor-pointer font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingProduct(null)}
                            className="text-zinc-500 hover:text-white p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 px-2.5 py-2 rounded-lg text-[11px] font-mono transition-all cursor-pointer border border-border/40"
                        >
                          <Image className="w-3.5 h-3.5" /> Attach Image URL
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEditForm(p)}
                        className="p-1.75 bg-zinc-900 border border-border/50 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
                        title="Edit specifications"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Remove this optical product from database records?")) deleteProductMutation.mutate(p.id); }}
                        className="p-1.75 bg-zinc-900 border border-border/50 hover:bg-rose-950/20 hover:border-rose-900/40 text-rose-500 rounded-lg transition-all cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide Drawer for Create or Update spectacles configurations */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backing mask */}
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={handleCloseForm} />

          {/* Drawer Paper body */}
          <div className="relative w-full max-w-lg bg-[#0c0c0e] border-l border-border h-full flex flex-col justify-between p-6 overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base font-mono">
                    {isEditing ? "Edit Optical specifications" : "Register New Eyeglass Pair"}
                  </h3>
                  <p className="text-zinc-500 text-[11px]">Specify frame parameters and category associations.</p>
                </div>
                <button
                  onClick={handleCloseForm}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-950 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Hook Form form elements */}
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
                {/* Field 1 */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono block">Product Title Name</label>
                  <input
                    type="text"
                    {...register("name")}
                    placeholder="e.g. Aero Titanium Oval Pro"
                    className="w-full bg-[#121214] border border-border px-3.5 py-2.5 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/80 transition-all font-mono"
                  />
                  {errors.name && <span className="text-xs text-rose-500 font-mono mt-1 block">{errors.name.message as string}</span>}
                </div>

                {/* Field 2 */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono block">Association Category</label>
                  <select
                    {...register("category_id")}
                    className="w-full bg-[#121214] border border-border px-3.5 py-2.5 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/80 transition-all font-mono cursor-pointer"
                  >
                    <option value={0}>Choose core category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <span className="text-xs text-rose-500 font-mono mt-1 block">{errors.category_id.message as string}</span>}
                </div>

                {/* Row pricing & stocks */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Under 1 */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono block">Settle Price ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("price")}
                      placeholder="Price"
                      className="w-full bg-[#121214] border border-border px-3.5 py-2.5 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/80 transition-all font-mono"
                    />
                    {errors.price && <span className="text-xs text-rose-500 font-mono mt-1 block">{errors.price.message as string}</span>}
                  </div>

                  {/* Under 2 */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono block">Initial Stock level</label>
                    <input
                      type="number"
                      {...register("stock")}
                      placeholder="Stock quantity"
                      className="w-full bg-[#121214] border border-border px-3.5 py-2.5 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/80 transition-all font-mono"
                    />
                    {errors.stock && <span className="text-xs text-rose-500 font-mono mt-1 block">{errors.stock.message as string}</span>}
                  </div>
                </div>

                {/* Status selector */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono block">Catalog Display Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-zinc-300 text-xs font-mono cursor-pointer">
                      <input type="radio" value="active" {...register("status")} className="accent-emerald-500" />
                      Active Catalog
                    </label>
                    <label className="flex items-center gap-2 text-zinc-300 text-xs font-mono cursor-pointer">
                      <input type="radio" value="inactive" {...register("status")} className="accent-emerald-500" />
                      Draft Hidden
                    </label>
                  </div>
                </div>

                {/* Description details */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono block">Specification Description</label>
                  <textarea
                    rows={4}
                    {...register("description")}
                    placeholder="Provide thickness ratings, composite materials, spring hinge status, optical lens coatings details..."
                    className="w-full bg-[#121214] border border-border px-3.5 py-2.5 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/80 transition-all font-mono"
                  />
                </div>

                {/* Confirm operations */}
                <div className="flex gap-3 pt-4 border-t border-border/60">
                  <button
                    type="submit"
                    id="submit-product-form"
                    className="flex-1 bg-linear-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs py-3 rounded-lg font-mono hover:from-emerald-500 hover:to-teal-400 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {createProductMutation.isPending || updateProductMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Apply Catalog Parameters"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="bg-zinc-900 border border-border text-zinc-400 hover:text-white px-5 py-3 rounded-lg text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
