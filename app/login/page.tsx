"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import {
  IconArrowLeft,
  IconMail,
  IconLock,
  IconLogin,
  IconBrandGoogle,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleNavigation = (path: string) => {
    setIsExiting(true);
    setTimeout(() => router.push(path), 600);
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: "customer",
          provider: "google",
          createdAt: new Date(),
        });
      }

      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#E0F2FE] dark:bg-black flex items-center justify-center p-4">

      <motion.div
        className="w-full max-w-sm bg-white dark:bg-[#09090b] rounded-[2rem] p-8 relative shadow-2xl dark:border dark:border-neutral-800"
        initial={{ opacity: 0, y: 50 }}
        animate={isExiting ? { opacity: 0, y: 50 } : { opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 70, damping: 20 }}
      >
        <button
          onClick={() => handleNavigation("/")}
          className="absolute top-6 left-6 text-neutral-400 hover:text-white"
        >
          <IconArrowLeft size={20} />
        </button>

        <div className="flex flex-col items-center mt-4 mb-6">
          <div className="w-12 h-12 bg-black dark:bg-[#18181b] rounded-xl flex items-center justify-center mb-4 text-white">
            <IconLogin size={24} />
          </div>
          <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
            Masuk
          </h1>
          <p className="text-xs text-black dark:text-neutral-400 text-center">
            Masuk untuk melanjutkan perjalananmu di wowfel.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white dark:bg-[#18181b] text-black dark:text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 border border-neutral-200 dark:border-neutral-700 transition hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-sm"
          >
            <IconBrandGoogle size={22} />
            Masuk dengan Google
          </button>
        </div>
      </motion.div>
    </div>
  );
}
