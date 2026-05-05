"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconUser, IconShieldLock, IconShieldCheck } from "@tabler/icons-react";
import Navbar from "../../components/Navbar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, orderBy, onSnapshot, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

    const q = query(collection(db, "users"));
    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, [router]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingId(userId);
      const userRef = doc(db, "users", userId);
      // We clear requestedRole if it matches or if changing the role manually
      await updateDoc(userRef, {
        role: newRole,
        requestedRole: null
      });
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    } finally {
      setUpdatingId(null);
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

      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-neutral-100 dark:border-slate-700 px-6 py-4 sticky top-16 z-40 transition-colors duration-200">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/profile" className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition text-neutral-600 dark:text-neutral-400">
            <IconArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight dark:text-white">User Management</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage rules and permissions for platform users</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {users.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 shadow-sm border border-neutral-100 dark:border-slate-700 flex flex-col items-center justify-center text-center transition-colors duration-200">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-500 dark:text-blue-400 mb-6">
              <IconUser size={40} stroke={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">No users found</h2>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {users.map((u) => (
              <div key={u.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-200">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-600">
                    {u.photoURL ? (
                      <img src={u.photoURL} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      u.email ? u.email[0].toUpperCase() : "U"
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-1 leading-tight">
                      {u.name || "Unknown User"}
                    </h3>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 flex flex-col sm:flex-row gap-1 sm:gap-3">
                      <span>{u.email}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">ID: {u.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">

                  {u.requestedRole && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
                      <IconShieldLock size={14} />
                      Requested: {u.requestedRole}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <select
                      value={u.role || "customer"}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={updatingId === u.id}
                      className={`pl-3 pr-8 py-2 rounded-xl text-sm font-semibold outline-none transition disabled:opacity-50 border
                                        ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200 focus:border-purple-500 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900/50' :
                          u.role === 'seller' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:border-blue-500 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50' :
                            'bg-slate-50 text-slate-700 border-slate-200 focus:border-slate-500 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700'}
                                    `}
                    >
                      <option value="customer">Customer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
