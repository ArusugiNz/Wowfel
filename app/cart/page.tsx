"use client";

import Link from "next/link";
import { IconArrowLeft, IconShoppingBag, IconTrash, IconMinus, IconPlus } from "@tabler/icons-react";
import { useCart } from "../../context/CartContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { toast } from "react-hot-toast";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ show: false, orderId: "", trakteerUrl: "" });
  const [userAddress, setUserAddress] = useState("");
  const router = useRouter();

  useEffect(() => {
      const fetchAddress = async () => {
          if (auth.currentUser) {
              const userRef = doc(db, "users", auth.currentUser.uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists() && userSnap.data().address) {
                  setUserAddress(userSnap.data().address);
              }
          }
      };
      fetchAddress();
  }, []);

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
        address: userAddress || "No address provided",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "transactions"), transactionData);

      // Deduct stock for each item
      for (const item of cart) {
          try {
              const productRef = doc(db, "products", item.id);
              await updateDoc(productRef, {
                  stock: increment(-item.quantity)
              });
          } catch (e) {
              console.error(`Failed to deduct stock for ${item.id}`, e);
          }
      }

      clearCart();
      setIsCheckingOut(false);
      setPaymentModal({
          show: true,
          orderId,
          trakteerUrl: finalTrakteerUrl
      });

    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error("Failed to complete checkout. Please try again.");
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFF] dark:bg-slate-900 font-sans text-neutral-900 dark:text-neutral-100 flex flex-col pb-20 transition-colors duration-200">
      <header className="flex flex-col bg-white dark:bg-slate-800 border-b border-neutral-100 dark:border-slate-700 px-4 py-4 sticky top-0 z-50 transition-colors duration-200">
        <div className="flex items-center gap-4 max-w-4xl mx-auto w-full">
          <Link href="/dashboard" className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition text-neutral-600 dark:text-neutral-300">
            <IconArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Shopping Cart</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{cart.length} items</p>
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
                <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700 flex items-center justify-between gap-4 transition-colors duration-200">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-20 h-20 shrink-0 bg-neutral-100 dark:bg-slate-700 rounded-xl overflow-hidden shadow-inner">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center gap-0.5 w-full">
                      <h3 className="font-semibold text-neutral-900 dark:text-white text-lg">{item.name}</h3>
                      <span className="text-sm text-neutral-400 dark:text-neutral-500">Luxury</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 mt-1">Rp {item.price.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  {/* Quantity & Delete Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-lg transition text-neutral-600 dark:text-neutral-400"
                      >
                        <IconMinus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium text-neutral-900 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-lg transition text-neutral-600 dark:text-neutral-400"
                      >
                        <IconPlus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                    >
                      <IconTrash size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Summary (Match User Screenshot Bottom Container) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700 flex flex-col gap-4 mt-2 transition-colors duration-200">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl flex flex-col gap-1 mb-2">
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Shipping Address</span>
                {userAddress ? (
                  <p className="text-sm text-blue-600 dark:text-blue-400 line-clamp-2">{userAddress}</p>
                ) : (
                  <p className="text-sm text-amber-600 dark:text-amber-500">No address set. <Link href="/settings" className="underline font-medium hover:text-amber-700 dark:hover:text-amber-400">Set it in settings</Link>.</p>
                )}
              </div>

              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-sm font-medium">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-sm font-medium">
                <span>Shipping</span>
                <span className="text-green-500 dark:text-green-400">Free</span>
              </div>

              <hr className="border-neutral-100 dark:border-slate-700 my-2" />

              <div className="flex items-center justify-between font-extrabold text-lg">
                <span className="text-neutral-900 dark:text-white">Total</span>
                <span className="text-blue-600 dark:text-blue-400">Rp {total.toLocaleString("id-ID")}</span>
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

      {/* Payment Instruction Modal */}
      {paymentModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl flex flex-col gap-4 text-center animate-scale-up">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <IconShoppingBag size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-neutral-900">Order Placed!</h2>
            
            <p className="text-neutral-500 text-sm">
              Your order ID is <br/>
              <span className="inline-block mt-2 font-mono font-bold text-lg text-neutral-900 bg-neutral-100 px-4 py-2 rounded-lg border border-neutral-200">
                  {paymentModal.orderId}
              </span>
            </p>

            <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm text-left border border-amber-100 my-2 shadow-sm">
              <strong>⚠️ Important:</strong> Please copy your Order ID and paste it into the <strong>Support Message</strong> box when paying on Trakteer so your order verifies automatically!
            </div>

            <button
              onClick={() => {
                window.open(paymentModal.trakteerUrl, "_blank");
                router.push("/orders");
              }}
              className="w-full bg-[#E5253A] text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-[#c91e32] transition active:scale-95 flex items-center justify-center gap-2"
            >
              <img src="https://trakteer.id/images/mix/logo-trakteer-icon.png" alt="Trakteer" className="w-5 h-5 object-contain filter brightness-0 invert" />
              Continue to Payment
            </button>
            
            <button
              onClick={() => router.push("/orders")}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-700 mt-2"
            >
                I'll pay later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}