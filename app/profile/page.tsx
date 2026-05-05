"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconBox,
  IconMapPin,
  IconSettings,
  IconHelpCircle,
  IconChevronRight,
  IconMail,
  IconLogout2,
  IconShieldCheck,
  IconUser
} from "@tabler/icons-react";
import Navbar from "../../components/Navbar";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setRole(userSnap.data().role || "customer");
          }
        } catch (error) {
          console.error("Failed fetching user role from Firestore", error);
        }
      } else {
        router.replace("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const menuItems = [
    { icon: <IconBox size={20} className="text-blue-600" />, label: "My Orders", href: "/orders", color: "bg-blue-50" },
    { icon: <IconSettings size={20} className="text-blue-600" />, label: "Settings", href: "/settings", color: "bg-blue-50" },
    { icon: <IconHelpCircle size={20} className="text-blue-600" />, label: "Help & Support", href: "/help", color: "bg-blue-50" },

    ...(role === "seller" || role === "admin"
      ? [{
        icon: <IconBox size={20} className="text-green-600" />,
        label: "Add Product",
        href: "/add-product",
        color: "bg-green-50"
      }]
      : []),

    ...(role === "admin"
      ? [
        {
          icon: <IconShieldCheck size={20} className="text-amber-600" />,
          label: "Transaction Confirmation",
          href: "/admin-transactions",
          color: "bg-amber-50"
        },
        {
          icon: <IconUser size={20} className="text-amber-600" />,
          label: "User Management",
          href: "/admin-users",
          color: "bg-amber-50"
        }
      ]
      : [])
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-neutral-900 dark:text-neutral-100 flex flex-col pb-20 transition-colors duration-200">
      <Navbar type="profile" />

      <div className="bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 pt-10 pb-20 px-6 relative">
        <div className="max-w-4xl mx-auto flex items-center gap-4 text-white">
          <div className="w-20 h-20 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center backdrop-blur-sm overflow-hidden shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold uppercase">{user?.displayName?.[0] || user?.email?.[0] || "U"}</span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {user?.displayName || "Hexagon User"}
              </h1>
              {role && (
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                  {role === "admin" && <IconShieldCheck size={12} />}
                  {role}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 opacity-80 mt-1">
              <IconMail size={16} />
              <span className="text-sm">{user?.email || "user@example.com"}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 -mt-10 relative z-10">

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700 overflow-hidden mb-6 transition-colors duration-200">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-slate-700 transition active:bg-neutral-100 dark:active:bg-slate-600 ${index !== menuItems.length - 1 ? "border-b border-neutral-100 dark:border-slate-700" : ""
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">{item.label}</span>
              </div>
              <IconChevronRight size={20} className="text-neutral-400 dark:text-neutral-500" />
            </Link>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-2xl shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-900/50 transition active:scale-95 font-medium"
        >
          <IconLogout2 size={20} />
          Logout
        </button>

      </main>
    </div>
  );
}
