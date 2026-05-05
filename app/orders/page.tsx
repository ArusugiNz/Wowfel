"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconBox, IconCheck, IconUpload, IconFileInvoice, IconStar } from "@tabler/icons-react";
import Navbar from "../../components/Navbar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function OrdersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [uploadingStruk, setUploadingStruk] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [ratingModal, setRatingModal] = useState({ show: false, productId: "", productName: "", rating: 5, submitting: false });

    const handleSubmitRating = async () => {
        if (!auth.currentUser) return;
        setRatingModal(prev => ({ ...prev, submitting: true }));
        try {
            const productRef = doc(db, "products", ratingModal.productId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                const data = productSnap.data();
                const newTotalRating = (data.totalRating || 0) + ratingModal.rating;
                const newRatingCount = (data.ratingCount || 0) + 1;

                await updateDoc(productRef, {
                    totalRating: newTotalRating,
                    ratingCount: newRatingCount,
                });

                toast.success("Thank you for your rating!");
            }
        } catch (error) {
            console.error("Error rating:", error);
            toast.error("Failed to submit rating.");
        } finally {
            setRatingModal({ show: false, productId: "", productName: "", rating: 5, submitting: false });
        }
    };

    const handleCancelOrder = async (transactionId: string) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;
        setCancellingId(transactionId);
        try {
            const transactionRef = doc(db, "transactions", transactionId);
            await updateDoc(transactionRef, {
                status: "cancelled"
            });

            // Find the transaction data to restore stock
            const orderToCancel = orders.find(o => o.id === transactionId);
            if (orderToCancel && orderToCancel.items) {
                for (const item of orderToCancel.items) {
                    try {
                        const productRef = doc(db, "products", item.id);
                        await updateDoc(productRef, {
                            stock: increment(item.quantity)
                        });
                    } catch (e) {
                        console.error("Failed to restore stock", e);
                    }
                }
            }

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
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-200">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-neutral-900 dark:text-neutral-100 flex flex-col pb-20 transition-colors duration-200">

            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-neutral-100 dark:border-slate-700 px-6 py-4 transition-colors duration-200">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/profile" className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition text-neutral-600 dark:text-neutral-400">
                        <IconArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">My Orders</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">View your purchase history and receipts</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
                {orders.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 shadow-sm border border-neutral-100 dark:border-slate-700 flex flex-col items-center justify-center text-center transition-colors duration-200">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-500 dark:text-blue-400 mb-6">
                            <IconBox size={40} stroke={1.5} />
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">No orders found</h2>
                        <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mb-8">
                            You haven't made any purchases yet. Start shopping to see your orders here.
                        </p>

                        <Link
                            href="/dashboard"
                            className="bg-neutral-900 dark:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-neutral-800 dark:hover:bg-blue-700 transition shadow-sm active:scale-95"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-slate-700 flex flex-col md:flex-row md:items-start justify-between gap-6 transition-colors duration-200">
                                <div className="flex-1 w-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                                            Order {order.orderId || `#${order.id.slice(0, 8).toUpperCase()}`}
                                        </span>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${order.status === "confirmed"
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            : order.status === "pending_verification"
                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                : order.status === "cancelled"
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                            }`}>
                                            {order.status === "confirmed" && <IconCheck size={14} />}
                                            {order.status === "confirmed" ? "Completed"
                                                : order.status === "pending_verification" ? "Verifying Payment"
                                                    : order.status === "cancelled" ? "Cancelled"
                                                        : "Awaiting Payment"}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Items</h3>
                                        <ul className="flex flex-col gap-3">
                                            {order.items?.map((item: any, idx: number) => (
                                                <li key={idx} className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-slate-700 overflow-hidden shrink-0">
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-neutral-900 dark:text-white">{item.name}</h4>
                                                        <div className="text-sm text-neutral-500 dark:text-neutral-400">Qty: {item.quantity}</div>
                                                    </div>
                                                    <div className="font-medium text-neutral-900 dark:text-white flex flex-col items-end gap-2">
                                                        <span>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                                                        {order.status === "confirmed" && (
                                                            <button
                                                                onClick={() => setRatingModal({ show: true, productId: item.id, productName: item.name, rating: 5, submitting: false })}
                                                                className="text-xs text-amber-600 hover:text-amber-700 font-bold bg-amber-50 px-2 py-1.5 rounded-md border border-amber-200 flex items-center gap-1 transition dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-400 dark:hover:text-amber-300"
                                                            >
                                                                <IconStar size={14} fill="currentColor" /> Rate
                                                            </button>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="border-t border-neutral-100 dark:border-slate-700 pt-4 flex flex-col gap-2">
                                        <div className="flex flex-col gap-1 text-sm text-neutral-600 dark:text-neutral-400 mb-2 p-3 bg-neutral-50 dark:bg-slate-800/50 rounded-xl border border-neutral-100 dark:border-slate-700">
                                            <span className="font-semibold text-neutral-900 dark:text-white">Shipping Address:</span>
                                            <span>{order.address || "No address provided"}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
                                            <span>Subtotal</span>
                                            <span>Rp {order.subtotal?.toLocaleString("id-ID")}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
                                            <span>Shipping</span>
                                            <span className="text-green-500">Free</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold text-neutral-900 dark:text-white mt-2">
                                            <span>Total</span>
                                            <span className="text-blue-600">Rp {order.total?.toLocaleString("id-ID")}</span>
                                        </div>
                                    </div>

                                    {order.status === "pending_payment" && (
                                        <div className="border-t border-neutral-100 dark:border-slate-700 pt-4 mt-4 flex flex-col gap-3">
                                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-semibold text-sm">
                                                    <IconFileInvoice size={18} />
                                                    Payment Required
                                                </div>
                                                <p className="text-xs text-amber-700 dark:text-amber-300/80">
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
                                                        className="flex items-center gap-2 bg-white dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer transition"
                                                    >
                                                        {uploadingStruk === order.id ? (
                                                            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            <IconUpload size={16} />
                                                        )}
                                                        {uploadingStruk === order.id ? "Uploading..." : "Upload Struk"}
                                                    </label>

                                                    {order.trakteerUrl && (
                                                        <a href={order.trakteerUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
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

            {/* Rating Modal */}
            {ratingModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl flex flex-col gap-4 text-center animate-scale-up border border-neutral-100 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Rate Product</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">How was your {ratingModal.productName}?</p>

                        <div className="flex justify-center gap-2 my-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRatingModal(prev => ({ ...prev, rating: star }))}
                                    className={`transition ${star <= ratingModal.rating ? 'text-amber-500 scale-110' : 'text-neutral-200 dark:text-slate-600 hover:text-amber-200'}`}
                                >
                                    <IconStar size={36} fill={star <= ratingModal.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setRatingModal({ show: false, productId: "", productName: "", rating: 5, submitting: false })}
                                className="flex-1 bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-neutral-300 font-bold py-3 rounded-xl hover:bg-neutral-200 dark:hover:bg-slate-600 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitRating}
                                disabled={ratingModal.submitting}
                                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {ratingModal.submitting ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
