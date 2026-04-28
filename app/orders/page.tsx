"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconBox, IconCheck, IconUpload, IconFileInvoice } from "@tabler/icons-react";
import Navbar from "../../components/Navbar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [uploadingStruk, setUploadingStruk] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelOrder = async (transactionId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancellingId(transactionId);
    try {
        const transactionRef = doc(db, "transactions", transactionId);
        await updateDoc(transactionRef, {
            status: "cancelled"
        });
        toast.success("Order cancelled successfully.");
    } catch (error) {
        console.error("Error cancelling order:", error);
        toast.error("Failed to cancel order.");
    } finally {
        setCancellingId(null);
    }
  };

  const handleUploadStruk = async (transactionId: string, file: File) => {
    setUploadingStruk(transactionId);
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Failed to upload image to Cloudinary");
        }

        const data = await response.json();
        const strukUrl = data.secure_url;

        const transactionRef = doc(db, "transactions", transactionId);
        await updateDoc(transactionRef, {
            status: "pending_verification",
            strukUrl
        });

        toast.success("Payment receipt uploaded! Waiting for verification.");
    } catch (error) {
        console.error("Error uploading struk:", error);
        toast.error("Failed to upload receipt.");
    } finally {
        setUploadingStruk(null);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setLoading(false);

      const q = query(
        collection(db, "transactions"), 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, [router]);

  if (loading) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-neutral-900 flex flex-col pb-20">
      <Navbar type="home" />

      {/* Header */}
      <header className="bg-white border-b border-neutral-100 px-6 py-4 sticky top-16 z-40">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Link href="/profile" className="p-2 hover:bg-neutral-100 rounded-full transition text-neutral-600">
                <IconArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-xl font-bold tracking-tight">My Orders</h1>
                <p className="text-sm text-neutral-500">View your purchase history and receipts</p>
            </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 shadow-sm border border-neutral-100 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-6">
                    <IconBox size={40} stroke={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">No orders found</h2>
                <p className="text-neutral-500 max-w-sm mb-8">
                    You haven't made any purchases yet. Start shopping to see your orders here.
                </p>
                
                <Link 
                    href="/dashboard"
                    className="bg-neutral-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-neutral-800 transition shadow-sm active:scale-95"
                >
                    Browse Products
                </Link>
            </div>
        ) : (
            <div className="flex flex-col gap-6">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1 w-full">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs text-neutral-400 font-mono">
                                    Order {order.orderId || `#${order.id.slice(0, 8).toUpperCase()}`}
                                </span>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                                    order.status === "confirmed" 
                                        ? "bg-green-100 text-green-700" 
                                        : order.status === "pending_verification"
                                        ? "bg-blue-100 text-blue-700"
                                        : order.status === "cancelled"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                }`}>
                                    {order.status === "confirmed" && <IconCheck size={14} />}
                                    {order.status === "confirmed" ? "Completed" 
                                        : order.status === "pending_verification" ? "Verifying Payment"
                                        : order.status === "cancelled" ? "Cancelled"
                                        : "Awaiting Payment"}
                                </span>
                            </div>
                            
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2">Items</h3>
                                <ul className="flex flex-col gap-3">
                                    {order.items?.map((item: any, idx: number) => (
                                        <li key={idx} className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-neutral-900">{item.name}</h4>
                                                <div className="text-sm text-neutral-500">Qty: {item.quantity}</div>
                                            </div>
                                            <div className="font-medium text-neutral-900">
                                                Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                                <div className="border-t border-neutral-100 pt-4 flex flex-col gap-2">
                                    <div className="flex justify-between text-sm text-neutral-500">
                                        <span>Subtotal</span>
                                        <span>Rp {order.subtotal?.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-neutral-500">
                                        <span>Shipping</span>
                                        <span className="text-green-500">Free</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-neutral-900 mt-2">
                                        <span>Total</span>
                                        <span className="text-blue-600">Rp {order.total?.toLocaleString("id-ID")}</span>
                                    </div>
                                </div>

                                {order.status === "pending_payment" && (
                                    <div className="border-t border-neutral-100 pt-4 mt-4 flex flex-col gap-3">
                                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                                                <IconFileInvoice size={18} />
                                                Payment Required
                                            </div>
                                            <p className="text-xs text-amber-700">
                                                Please complete your payment via Trakteer and upload the receipt (struk) here. 
                                                Make sure to include your Order ID <strong>{order.orderId}</strong> in the Trakteer message!
                                            </p>
                                            
                                            <div className="mt-2 flex items-center gap-3">
                                                <input 
                                                    type="file" 
                                                    id={`upload-${order.id}`}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            handleUploadStruk(order.id, e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                                <label 
                                                    htmlFor={`upload-${order.id}`}
                                                    className="flex items-center gap-2 bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 cursor-pointer transition"
                                                >
                                                    {uploadingStruk === order.id ? (
                                                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <IconUpload size={16} />
                                                    )}
                                                    {uploadingStruk === order.id ? "Uploading..." : "Upload Struk"}
                                                </label>
                                                
                                                {order.trakteerUrl && (
                                                    <a href={order.trakteerUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-medium">
                                                        Open Trakteer
                                                    </a>
                                                )}

                                                <button
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    disabled={cancellingId === order.id}
                                                    className="ml-auto text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                                                >
                                                    {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
