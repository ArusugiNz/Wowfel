"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { IconArrowLeft, IconShoppingCartPlus, IconStarFilled, IconShieldCheck, IconTruck, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Toast from "../../../components/Toast";
import { useCart, Product } from "../../../context/CartContext";
import Product3DViewer from "../../../components/Product3DViewer";
import Reviews from "../../../components/Reviews";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await fetch(`/api/get-user?uid=${user.uid}`);
          if (userDoc.ok) {
            const data = await userDoc.json();
            setUserRole(data.role);
          }
        } catch (err) {
          console.error("Failed to fetch user role", err);
        }
      } else {
        setUserRole("");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      if (!id || typeof id !== "string") return;

      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({
            id: docSnap.id,
            name: data.name,
            price: parseFloat(data.price),
            image: data.image || "https://images.unsplash.com/photo-1627989580309-bfaf3e58af6f?q=80&w=2671&auto=format&fit=crop",
            ...data
          } as Product);
        } else {
          console.error("No such product!");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  const handleAdd = () => {
    if (product) {
      addToCart(product, quantity);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!product || !confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", product.id));
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col transition-colors">
        <Navbar type="home" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col transition-colors">
        <Navbar type="home" />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Product Not Found</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">This item may have been removed or the link is invalid.</p>
          <Link href="/dashboard" className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-6 py-3 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans text-neutral-900 dark:text-neutral-100 flex flex-col pb-20 transition-colors">
      <Navbar type="home" />
      <Toast show={showToast} message={`${quantity}x Added to cart!`} />

      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-neutral-100 dark:border-zinc-800 px-6 py-4 sticky top-16 z-40 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-full transition text-neutral-600 dark:text-neutral-400">
            <IconArrowLeft size={20} />
          </button>
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Back to products</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-6 py-8 md:py-12">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-10 shadow-sm border border-neutral-100 dark:border-zinc-800 flex flex-col md:flex-row gap-8 lg:gap-16 transition-colors">

          {/* Left: 3D or 2.5D Image Hero */}
          <div className="flex-1">
            <div className="relative aspect-square md:aspect-4/3 w-full bg-neutral-100 dark:bg-zinc-800/50 rounded-2xl overflow-hidden shadow-inner border border-neutral-100 dark:border-zinc-800">
              <Product3DViewer 
                imageUrl={product.image || "https://images.unsplash.com/photo-1627989580309-bfaf3e58af6f?q=80&w=2671&auto=format&fit=crop"} 
              />
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center text-amber-500 gap-1 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-lg w-max mb-4">
              <IconStarFilled size={16} />
              <span className="text-sm font-bold tracking-wide">
                {product.ratingCount && product.ratingCount > 0 
                  ? ((product.totalRating || 0) / product.ratingCount).toFixed(1) 
                  : "New"} 
                <span className="text-neutral-400 dark:text-neutral-500 font-medium ml-1">
                  ({product.ratingCount || 0} reviews)
                </span>
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">
                {product.name}
              </h1>
              {(auth.currentUser?.uid === product.sellerId || userRole === "admin") && (
                <button
                  onClick={handleDelete}
                  className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition shrink-0"
                  title="Delete Product"
                >
                  <IconTrash size={20} />
                </button>
              )}
            </div>

            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">
              Rp {product.price.toLocaleString("id-ID")}
            </p>

            <div className="prose prose-neutral dark:prose-invert mb-8">
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-lg">
                {product.description || "Modern designer hexagon package with metallic accents. Features a unique opening mechanism and a premium matte finish perfect for luxury gifting."}
              </p>
            </div>

            <hr className="border-neutral-100 dark:border-zinc-800 my-6" />

            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300 font-medium">
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                  <IconShieldCheck size={20} />
                </div>
                Secure Checkout & Authenticity Guaranteed
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300 font-medium">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <IconTruck size={20} />
                </div>
                Free Priority Shipping Worldwide
              </div>
            </div>

            {/* Add to Cart Actions */}
            <div className="mt-auto flex flex-col sm:flex-row gap-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50 border border-neutral-200 dark:border-zinc-700 rounded-xl px-2 py-1 shadow-sm sm:w-32">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-zinc-700 rounded-lg transition text-neutral-600 dark:text-neutral-400 font-bold"
                >
                  -
                </button>
                <span className="text-lg font-bold w-8 text-center dark:text-neutral-100">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-zinc-700 rounded-lg transition text-neutral-600 dark:text-neutral-400 font-bold"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAdd}
                disabled={product.stock !== undefined && product.stock <= 0}
                className="flex-1 flex items-center justify-center gap-2 bg-[#09090b] dark:bg-white text-white dark:text-zinc-950 px-8 py-4 rounded-xl font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition shadow-md active:scale-95 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconShoppingCartPlus size={24} />
                {product.stock === undefined || product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                {(product.stock === undefined || product.stock > 0) && (
                    <span className="ml-2 bg-white/20 dark:bg-black/10 px-2 py-0.5 rounded-md text-sm">
                        Rp {(product.price * quantity).toLocaleString("id-ID")}
                    </span>
                )}
              </button>
            </div>

            <p className={`text-xs text-center mt-4 ${(product.stock !== undefined && product.stock <= 0) ? 'text-red-500 font-bold' : 'text-neutral-400 dark:text-neutral-500'}`}>
              {(product.stock !== undefined && product.stock <= 0) ? "Currently out of stock" : `Only ${product.stock || 'a few'} items left in stock — order soon.`}
            </p>

          </div>
        </div>

        <Reviews productId={product.id} />
      </main>
    </div>
  );
}
