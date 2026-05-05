"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconShoppingCartPlus, IconStarFilled, IconTrash } from "@tabler/icons-react";
import Navbar from "../../components/Navbar";
import Toast from "../../components/Toast";
import { toast } from "react-hot-toast";
import { useCart, Product } from "../../context/CartContext";

import Hexagon3DViewer from "../../components/Hexagon3DViewer";

export default function Dashboard() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [userRole, setUserRole] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState({ show: false, id: "", stock: 0, price: 0 });

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.uid);

      try {
        const userDoc = await fetch(`/api/get-user?uid=${user.uid}`);
        if (userDoc.ok) {
          const data = await userDoc.json();
          setUserRole(data.role);
        }
      } catch (err) {
        console.error("Failed to fetch user role", err);
      }

      try {
        unsubscribeSnapshot = onSnapshot(collection(db, "products"), (snapshot) => {
          const items: Product[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({
              id: docSnap.id,
              name: data.name || "Unknown Product",
              price: parseFloat(data.price) || 0,
              image: data.image || "https://images.unsplash.com/photo-1627989580309-bfaf3e58af6f?q=80&w=2671&auto=format&fit=crop",
              ...data
            } as any);
          });
          setProducts(items);
        }, (error) => {
          console.error("Error fetching live products:", error);
        });
      } catch (error) {
        console.error("Error setting up snapshot:", error);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [router]);

  const handleSaveEdit = async () => {
    try {
      const productRef = doc(db, "products", editModal.id);
      await updateDoc(productRef, {
        stock: editModal.stock,
        price: editModal.price
      });
      toast.success("Product updated successfully!");
      setEditModal({ show: false, id: "", stock: 0, price: 0 });
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product.");
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", productId));
      toast.success("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product.");
    }
  };

  const handleAdd = (product: Product) => {
    addToCart(product);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-neutral-900 dark:text-neutral-100 pb-20 transition-colors duration-200">
      <Navbar type="home" />
      <Toast show={showToast} message="Added to cart!" />

      <main>
        <section className="px-6 py-8 md:py-12 max-w-7xl mx-auto">
          <div className="rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 md:p-16 text-white shadow-lg overflow-hidden relative">
            <div className="absolute -top-24 -right-16 opacity-10 blur-2xl pointer-events-none">
              <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-2xl flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">
                    Premium Hexagon Packages
                  </h1>
                  {userRole && userRole !== "customer" && (
                    <div className="hidden md:flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wider shadow-sm border border-white/10">
                      {userRole === "admin" && <IconStarFilled size={14} className="text-amber-300" />}
                      {userRole}
                    </div>
                  )}
                </div>
                <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-lg">
                  Unique hexagon-shaped gift boxes for every occasion
                </p>
                <button
                  onClick={() => document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl hover:bg-neutral-50 transition shadow-sm hover:shadow active:scale-95"
                >
                  Shop Now
                </button>
              </div>
              
              <div className="w-full md:w-[400px] h-[300px] md:h-[400px] shrink-0">
                <Hexagon3DViewer />
              </div>
            </div>
          </div>
        </section>
        {(userRole === "seller" || userRole === "admin") && (
          <section className="px-6 py-4 max-w-7xl mx-auto flex gap-4">
            <button
              onClick={() => router.push(`/add-product?role=${userRole}`)}
              className="bg-neutral-900 text-white px-5 py-2.5 rounded-xl font-medium shadow hover:bg-neutral-800 transition"
            >
              Add Product
            </button>
            {userRole === "admin" && (
              <button
                onClick={() => router.push("/admin-transactions")}
                className="bg-amber-400 text-amber-950 px-5 py-2.5 rounded-xl font-medium shadow hover:bg-amber-300 transition"
              >
                Kelola Transaksi
              </button>
            )}
          </section>
        )}

        <section id="featured-products" className="px-6 py-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Featured Products
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-neutral-400">
                <p>Loading products from Firebase...</p>
              </div>
            ) : (
              products.map((product) => (
                <div
                  className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-none border border-neutral-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition duration-300 relative"
                  key={product.id}
                >
                  <Link href={`/product/${product.id}`} className="absolute inset-0 z-0"></Link>
                  <div className="relative aspect-4/3 bg-neutral-100 dark:bg-slate-700 overflow-hidden z-10 pointer-events-none">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition duration-500 ease-in-out"
                    />
                  </div>

                  <div className="p-5 flex flex-col grow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-neutral-900 dark:text-white leading-tight">
                        {product.name}
                      </h3>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-500 px-2 py-1 rounded-md">
                          <IconStarFilled size={12} />
                          <span className="text-xs font-bold">
                            {product.ratingCount && product.ratingCount > 0
                              ? ((product.totalRating || 0) / product.ratingCount).toFixed(1)
                              : "New"}
                          </span>
                        </div>
                        {(product.sellerId === userId || userRole === "admin") && (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setEditModal({ show: true, id: product.id, stock: product.stock || 0, price: product.price });
                              }}
                              className="relative z-20 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded hover:bg-neutral-200 dark:hover:bg-slate-600 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleDelete(product.id);
                              }}
                              className="relative z-20 text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition"
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 mb-4 grow">
                      {product.description || "Modern designer hexagon package with metallic accents. Features a unique opening mechanism."}
                    </p>

                    <div className="flex items-center gap-4 mt-auto pt-4 border-t border-neutral-100 dark:border-slate-700">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-blue-600">
                          Rp {product.price.toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs text-neutral-500 font-medium">
                          {product.stock === undefined ? "In Stock" : product.stock > 0 ? `Stock: ${product.stock}` : <span className="text-red-500 font-bold">Out of Stock</span>}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAdd(product);
                        }}
                        disabled={product.stock !== undefined && product.stock <= 0}
                        className="relative z-20 ml-auto flex items-center gap-2 bg-neutral-900 dark:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-neutral-800 dark:hover:bg-blue-700 active:scale-95 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IconShoppingCartPlus size={18} />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Edit Product Modal */}
      {editModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4 text-neutral-900 dark:text-white animate-scale-up border border-neutral-100 dark:border-slate-700">
            <h2 className="text-xl font-bold">Edit Product</h2>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Stock Quantity</label>
              <input
                type="number"
                value={editModal.stock}
                onChange={e => setEditModal({ ...editModal, stock: parseInt(e.target.value) || 0 })}
                className="border border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Price (Rp)</label>
              <input
                type="number"
                value={editModal.price}
                onChange={e => setEditModal({ ...editModal, price: parseFloat(e.target.value) || 0 })}
                className="border border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setEditModal({ show: false, id: "", stock: 0, price: 0 })}
                className="flex-1 bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-neutral-300 font-semibold py-3 rounded-xl hover:bg-neutral-200 dark:hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}