"use client";

import Link from "next/link";
import { IconArrowLeft, IconShoppingBag, IconTrash, IconMinus, IconPlus } from "@tabler/icons-react";
import { useCart } from "../../context/CartContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to checkout.");
      router.push("/login");
      return;
    }

    try {
      setIsCheckingOut(true);

      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

      let trakteerUrl = "https://trakteer.id/naufal_zaidan4/tip";
      if (cart.length > 0 && (cart[0] as any).sellerId) {
        try {
          const sellerDoc = await getDoc(doc(db, "users", (cart[0] as any).sellerId));
          if (sellerDoc.exists() && sellerDoc.data().trakteerUrl) {
            trakteerUrl = sellerDoc.data().trakteerUrl;
          }
        } catch (e) {
          console.error("Failed to fetch seller Trakteer URL", e);
        }
      }

      const trakteerUnitAmount = 1000;
      const quantity = Math.ceil(total / trakteerUnitAmount);

      const finalTrakteerUrl = `${trakteerUrl}?quantity=${quantity}`;

      const transactionData = {
        userId: user.uid,
        userEmail: user.email,
        items: cart,
        subtotal,
        total,
        status: "pending_payment",
        orderId,
        sellerId: (cart[0] as any).sellerId || null,
        trakteerUrl,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "transactions"), transactionData);

      clearCart();
      toast.success(`Redirecting... Please put Order ID ${orderId} in the message!`, { duration: 6000 });

      window.open(finalTrakteerUrl, "_blank");

      router.push("/orders");

    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error("Failed to complete checkout. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFF] font-sans text-neutral-900 flex flex-col pb-20">
      <header className="flex flex-col bg-white border-b border-neutral-100 px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4 max-w-4xl mx-auto w-full">
          <Link href="/dashboard" className="p-2 hover:bg-neutral-100 rounded-full transition text-neutral-600">
            <IconArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Shopping Cart</h1>
            <p className="text-sm text-neutral-500">{cart.length} items</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center p-4 md:p-8">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="bg-slate-200/50 p-6 rounded-3xl mb-6">
              <IconShoppingBag size={80} className="text-slate-400 stroke-[1.5]" />
            </div>

            <h2 className="text-2xl font-bold tracking-tight mb-2">Your cart is empty</h2>
            <p className="text-neutral-500 mb-8 max-w-sm text-center">
              Add some hexagon packages to get started
            </p>

            <Link
              href="/dashboard"
              className="bg-neutral-950 text-white font-medium px-8 py-3 rounded-xl hover:bg-neutral-800 transition active:scale-95 shadow-sm"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-4xl flex flex-col gap-6">

            {/* Products List (Match User Screenshot Top Container) */}
            <div className="flex flex-col gap-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-20 h-20 shrink-0 bg-neutral-100 rounded-xl overflow-hidden shadow-inner">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center gap-0.5 w-full">
                      <h3 className="font-semibold text-neutral-900 text-lg">{item.name}</h3>
                      <span className="text-sm text-neutral-400">Luxury</span>
                      <span className="font-bold text-blue-600 mt-1">Rp {item.price.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  {/* Quantity & Delete Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-neutral-200 rounded-xl p-1 shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-lg transition text-neutral-600"
                      >
                        <IconMinus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-lg transition text-neutral-600"
                      >
                        <IconPlus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-red-50 text-red-500 rounded-xl transition border border-transparent hover:border-red-100"
                    >
                      <IconTrash size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Summary (Match User Screenshot Bottom Container) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between text-neutral-600 text-sm font-medium">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 text-sm font-medium">
                <span>Shipping</span>
                <span className="text-green-500">Free</span>
              </div>

              <hr className="border-neutral-100 my-2" />

              <div className="flex items-center justify-between font-extrabold text-lg">
                <span className="text-neutral-900">Total</span>
                <span className="text-blue-600">Rp {total.toLocaleString("id-ID")}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || cart.length === 0}
                className="w-full bg-[#E5253A] text-white font-bold py-4 rounded-xl shadow-sm hover:bg-[#c91e32] transition active:scale-95 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCheckingOut ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <img src="https://trakteer.id/images/mix/logo-trakteer-icon.png" alt="Trakteer" className="w-5 h-5 object-contain filter brightness-0 invert" />
                    Pay with Trakteer
                  </>
                )}
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}