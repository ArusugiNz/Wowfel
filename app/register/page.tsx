"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import {
  IconArrowLeft,
  IconMail,
  IconLock,
  IconUserPlus,
  IconUser,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNavigation = (path: string) => {
    setIsExiting(true);
    setTimeout(() => router.push(path), 600);
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      alert("Semua field wajib diisi");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role: "customer",
        createdAt: new Date(),
      });

      router.push("/login");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
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
          <div className="w-12 h-12 bg-[#18181b] rounded-xl flex items-center justify-center mb-4 text-white">
            <IconUserPlus size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Daftar dengan email
          </h1>
          <p className="text-xs text-neutral-400 text-center">
            Buat akun baru dan bergabunglah dengan KasKuy.
          </p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <IconUser
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#18181b] text-white placeholder:text-neutral-400 rounded-xl py-3 pl-11 pr-4 focus:outline-none"
            />
          </div>

          <div className="relative">
            <IconMail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={18}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#18181b] text-white placeholder:text-neutral-400 rounded-xl py-3 pl-11 pr-4 focus:outline-none"
            />
          </div>

          <div className="relative">
            <IconLock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={18}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#18181b] text-white placeholder:text-neutral-400 rounded-xl py-3 pl-11 pr-4 focus:outline-none"
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-white text-black py-3.5 rounded-xl mt-4 font-semibold"
          >
            {loading ? "Mendaftarkan..." : "Buat Akun"}
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-neutral-400">
          Sudah punya akun?{" "}
          <button
            onClick={() => handleNavigation("/login")}
            className="text-white font-bold hover:underline"
          >
            Masuk di sini
          </button>
        </div>
      </motion.div>
    </div>
  );
}
