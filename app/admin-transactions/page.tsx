"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconReceipt, IconCheck, IconX, IconPhoto } from "@tabler/icons-react";
import Navbar from "../../components/Navbar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, increment } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function AdminTransactionsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.replace("/login");
                return;
            }
            try {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                const role = userSnap.data()?.role;

                if (role !== "admin") {
                    router.replace("/dashboard");
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error verifying admin state:", error);
                router.replace("/dashboard");
            }
        });

        const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            const transData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(transData);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeSnapshot();
        };
    }, [router]);

    const handleConfirmTransaction = async (transactionId: string) => {
        try {
            setUpdatingId(transactionId);
            const transactionRef = doc(db, "transactions", transactionId);
            await updateDoc(transactionRef, {
                status: "confirmed"
            });
            toast.success("Transaction confirmed successfully");
        } catch (error) {
            console.error("Error confirming transaction:", error);
            toast.error("Failed to confirm transaction");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCancelTransaction = async (transactionId: string) => {
        if (!confirm("Are you sure you want to cancel/reject this order?")) return;
        try {
            setCancellingId(transactionId);
            const transactionRef = doc(db, "transactions", transactionId);
            await updateDoc(transactionRef, {
                status: "cancelled"
            });

            const transactionToCancel = transactions.find(t => t.id === transactionId);
            if (transactionToCancel && transactionToCancel.items) {
                for (const item of transactionToCancel.items) {
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

            toast.success("Transaction cancelled successfully");
        } catch (error) {
            console.error("Error cancelling transaction:", error);
            toast.error("Failed to cancel transaction");
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-200">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-neutral-900 dark:text-neutral-100 pb-20 transition-colors duration-200">
            <Navbar type="home" />

            <header className="bg-white dark:bg-slate-800 border-b border-neutral-100 dark:border-slate-700 px-6 py-4 sticky top-16 z-40 transition-colors duration-200">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition text-neutral-600 dark:text-neutral-400">
                        <IconArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight dark:text-white">Transaction Confirmation</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage and verify customer orders</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">

                {transactions.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 shadow-sm border border-neutral-100 dark:border-slate-700 flex flex-col items-center justify-center text-center transition-colors duration-200">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-500 dark:text-blue-400 mb-6">
                            <IconReceipt size={40} stroke={1.5} />
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">No pending transactions</h2>
                        <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mb-8">
                            All customer orders have been processed. New transactions requiring confirmation will appear here.
                        </p>

                        <Link
                            href="/dashboard"
                            className="bg-neutral-900 dark:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-neutral-800 dark:hover:bg-blue-700 transition shadow-sm active:scale-95"
                        >
                            Return to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {transactions.map((transaction) => (
                            <div key={transaction.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-200">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                            transaction.status === "confirmed"
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : transaction.status === "pending_verification"
                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                : transaction.status === "cancelled"
                                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                            }`}>
                                            {transaction.status === "confirmed" ? "Confirmed" 
                                            : transaction.status === "pending_verification" ? "Pending Verification"
                                            : transaction.status === "cancelled" ? "Cancelled"
                                            : "Awaiting Payment"}
                                        </span>
                                        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                                            ID: {transaction.orderId || transaction.id.slice(0, 8)}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-1">
                                        {transaction.userEmail}
                                    </h3>

                                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                        {transaction.items?.length || 0} items • <span className="text-neutral-900 dark:text-white font-semibold">Rp {transaction.total?.toLocaleString("id-ID")}</span>
                                    </div>

                                    <div className="bg-neutral-50 dark:bg-slate-900/50 rounded-xl p-4 border border-neutral-100 dark:border-slate-700">
                                        <div className="mb-4 text-sm">
                                            <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Shipping Address</h4>
                                            <p className="text-neutral-700 dark:text-neutral-300">{transaction.address || "No address provided"}</p>
                                        </div>
                                        <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Order Details</h4>
                                        <ul className="flex flex-col gap-2">
                                            {transaction.items?.map((item: any, idx: number) => (
                                                <li key={idx} className="flex items-center justify-between text-sm">
                                                    <span className="text-neutral-700 dark:text-neutral-300">{item.quantity}x {item.name}</span>
                                                    <span className="text-neutral-500 dark:text-neutral-400">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {transaction.strukUrl && (
                                            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-slate-700">
                                                <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Payment Receipt</h4>
                                                <a href={transaction.strukUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm">
                                                    <IconPhoto size={16} /> View Receipt
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    {['pending', 'pending_payment', 'pending_verification'].includes(transaction.status) && (
                                        <>
                                            <button
                                                onClick={() => handleCancelTransaction(transaction.id)}
                                                disabled={cancellingId === transaction.id || updatingId === transaction.id}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition shadow-sm active:scale-95 disabled:opacity-50 border border-red-100 dark:border-red-900/50"
                                            >
                                                {cancellingId === transaction.id ? "..." : "Reject"}
                                            </button>
                                            <button
                                                onClick={() => handleConfirmTransaction(transaction.id)}
                                                disabled={updatingId === transaction.id || cancellingId === transaction.id}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-500 transition shadow-sm active:scale-95 disabled:opacity-50"
                                            >
                                                {updatingId === transaction.id ? (
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <IconCheck size={20} />
                                                        <span>Confirm Order</span>
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    )}
                                    {transaction.status === "confirmed" && (
                                        <div className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-6 py-3 rounded-xl font-medium border border-green-200 dark:border-green-900/50">
                                            <IconCheck size={20} />
                                            <span>Verified</span>
                                        </div>
                                    )}
                                    {transaction.status === "cancelled" && (
                                        <div className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-6 py-3 rounded-xl font-medium border border-red-200 dark:border-red-900/50">
                                            <IconX size={20} />
                                            <span>Cancelled</span>
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
