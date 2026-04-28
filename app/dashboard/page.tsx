"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconShoppingCartPlus, IconStarFilled } from "@tabler/icons-react";
import Navbar from "../../components/Navbar";
import Toast from "../../components/Toast";
import { useCart, Product } from "../../context/CartContext";

export default function Dashboard() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [userRole, setUserRole] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

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
        const querySnapshot = await getDocs(collection(db, "products"));
        const items: Product[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            name: data.name || "Unknown Product",
            price: parseFloat(data.price) || 0,
            image: data.image || "https://images.unsplash.com/photo-1627989580309-bfaf3e58af6f?q=80&w=2671&auto=format&fit=crop",
            ...data
          });
        });
        setProducts(items);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    });

    return () => unsubscribe();
  }, [router]);

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

            <div className="relative z-10 max-w-2xl">
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
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-lg text-neutral-900 dark:text-white leading-tight">
                        {product.name}
                      </h3>
                      <div className="flex items-center text-amber-500 gap-1 shrink-0 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">
                        <IconStarFilled size={14} />
                        <span className="text-sm font-medium">4.7</span>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 mb-4 grow">
                      {(product as any).description || "Modern designer hexagon package with metallic accents. Features a unique opening mechanism."}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100 dark:border-slate-700">
                      <span className="text-2xl font-bold text-blue-600">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAdd(product);
                        }}
                        className="relative z-20 flex items-center gap-2 bg-neutral-900 dark:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-neutral-800 dark:hover:bg-blue-700 active:scale-95 transition shadow-sm"
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
    </div>
  );
}