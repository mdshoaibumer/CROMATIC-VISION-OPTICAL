import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Trash2,
  Edit,
  FolderOpen,
  X,
  Tag,
  Loader2,
  Folders
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { Category, Product } from "../types";

// Validation schema
const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().optional(),
  description: z.string().min(1, "Description is required")
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function CategoriesModule() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Queries
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiRequest<Category[]>("/admin/categories")
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => apiRequest<Product[]>("/admin/products")
  });

  // Setup form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: ""
    }
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (values: CategoryFormValues) => apiRequest<Category>("/admin/categories", "POST", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      handleCloseForm();
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: CategoryFormValues }) =>
      apiRequest<Category>(`/admin/categories/${id}`, "PUT", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      handleCloseForm();
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest<any>(`/admin/categories/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    }
  });

  // Event handlers
  const handleOpenCreateForm = () => {
    setEditingCategory(null);
    reset({ name: "", slug: "", description: "" });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (cat: Category) => {
    setEditingCategory(cat);
    reset({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || ""
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    reset();
  };

  const onFormSubmit = (data: CategoryFormValues) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, values: data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  // Compute products associated to each category
  const getProductCount = (categoryId: number) => {
    return products.filter(p => p.category_id === categoryId).length;
  };

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-zinc-400 uppercase font-mono">Catalog Categories</h2>
          <p className="text-xs text-zinc-500">Create classification layers for filters.</p>
        </div>
        <button
          onClick={handleOpenCreateForm}
          id="btn-add-category"
          className="flex items-center justify-center gap-2 bg-linear-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs px-4 py-3 rounded-lg font-mono transition-all duration-200 cursor-pointer shadow-md shadow-emerald-950/20 active:scale-97"
        >
          <Plus className="w-4 h-4" /> Add Category Class
        </button>
      </div>

      {/* Grid container of classes */}
      {isLoadingCategories ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-xs font-mono">Loading core category structures...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 bg-[#121213]/20 border border-border/40 rounded-xl space-y-3">
          <Folders className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-sm font-mono text-zinc-400">Class parameters empty</p>
          <p className="text-xs text-zinc-500">Create lens materials or coating presets to support optical assemblies.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => {
            const itemCount = getProductCount(cat.id);
            return (
              <div
                key={cat.id}
                id={`category-card-${cat.id}`}
                className="bg-[#121214]/50 border border-border/60 rounded-xl p-5 hover:border-teal-500/20 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950/30 border border-emerald-900/30 flex items-center justify-center text-emerald-400">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-200 text-sm font-mono">{cat.name}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">slug: {cat.slug}</span>
                      </div>
                    </div>

                    <span className="bg-zinc-950 border border-border/40 px-2.5 py-1 rounded text-[10px] font-mono text-emerald-400">
                      {itemCount} active glasses
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-normal min-h-[36px]">
                    {cat.description || "Supports multiple lens parameters and customized frame templates."}
                  </p>
                </div>

                {/* Operations */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/30 mt-4">
                  <button
                    onClick={() => handleOpenEditForm(cat)}
                    className="p-2 bg-zinc-900 border border-border/60 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Class
                  </button>
                  <button
                    onClick={() => {
                      if (itemCount > 0) {
                        alert("This category index contains associated active products. Please move or delete products first!");
                        return;
                      }
                      if (confirm(`Remove category "${cat.name}" from database indexes?`)) {
                        deleteCategoryMutation.mutate(cat.id);
                      }
                    }}
                    className="p-2 bg-zinc-900 border border-border/60 hover:bg-rose-950/15 hover:border-rose-900/40 text-rose-500 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Adding/Editing slider */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCloseForm} />

          {/* Drawer Paper body */}
          <div className="relative w-full max-w-md bg-[#0c0c0e] border-l border-border h-full flex flex-col justify-between p-6 overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base font-mono">
                    {editingCategory ? "Update Classification" : "Create New Catalog Class"}
                  </h3>
                  <p className="text-zinc-500 text-[11px]">Categorize eyeglasses and protective lens types.</p>
                </div>
                <button
                  onClick={handleCloseForm}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-950 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form elements */}
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
                {/* Field 1 */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono block">Class Title Name</label>
                  <input
                    type="text"
                    {...register("name")}
                    placeholder="e.g. Photochromic Transitions"
                    className="w-full bg-[#121214] border border-border px-3.5 py-2.5 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/80 transition-all font-mono"
                  />
                  {errors.name && <span className="text-xs text-rose-500 font-mono mt-1 block">{errors.name.message}</span>}
                </div>

                {/* Field 2 */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#22c55e] font-mono block">Slug (Optional fallback generated automatically)</label>
                  <input
                    type="text"
                    {...register("slug")}
                    placeholder="e.g. phototransitions"
                    className="w-full bg-[#121214] border border-border px-3.5 py-2.5 rounded-lg text-sm text-zinc-300 placeholder-zinc-650 focus:outline-none focus:border-emerald-500/80 transition-all font-mono"
                  />
                </div>

                {/* Description details */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono block">Class Profile Summary</label>
                  <textarea
                    rows={4}
                    {...register("description")}
                    placeholder="Describe lens indexes, refractive qualities, anti glare characteristics..."
                    className="w-full bg-[#121214] border border-border px-3.5 py-2.5 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/80 transition-all font-mono"
                  />
                  {errors.description && <span className="text-xs text-rose-500 font-mono mt-1 block">{errors.description.message}</span>}
                </div>

                {/* Submit operations */}
                <div className="flex gap-3 pt-6 border-t border-border/60">
                  <button
                    type="submit"
                    className="flex-1 bg-linear-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs py-3 rounded-lg font-mono hover:from-emerald-500 hover:to-teal-400 transition-all active:scale-98 cursor-pointer flex justify-center items-center gap-1.5"
                  >
                    {createCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Apply Classification"
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
