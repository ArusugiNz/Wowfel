"use client";

import Link from "next/link";
import { IconShoppingCart, IconUser } from "@tabler/icons-react";
import { useCart } from "../context/CartContext";

export default function Navbar({ type = "home" }: { type?: "home" | "cart" | "profile" }) {
  const { cart } = useCart();
  
  return (
    <nav className="flex items-center justify-between px-6 bg-white dark:bg-slate-900 shrink-0 h-16 shadow-sm dark:shadow-none dark:border-b dark:border-slate-800 z-50 sticky top-0 transition-colors duration-200">
      <Link href="/dashboard" className="flex items-center gap-2 drop-shadow-sm">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 text-white">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" />
            <path d="M3.3 7L12 12l8.7-5" />
            <path d="M12 22V12" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Wowfel</span>
      </Link>

      <div className="flex flex-row items-center gap-6 text-neutral-600 dark:text-neutral-400">
        <Link 
            href="/cart" 
            className={`relative transition hover:text-black dark:hover:text-white ${type === "cart" ? "text-blue-600 dark:text-blue-400" : ""}`}
        >
          <IconShoppingCart size={24} stroke={1.5} />
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {cart.length}
            </span>
          )}
        </Link>
        <Link 
            href="/profile" 
            className={`transition hover:text-black dark:hover:text-white ${type === "profile" ? "text-blue-600 dark:text-blue-400" : ""}`}
        >
          <IconUser size={24} stroke={1.5} />
        </Link>
      </div>
    </nav>
  );
}
