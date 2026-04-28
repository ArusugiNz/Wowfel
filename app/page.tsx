"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace("/login");
        }, 2000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white overflow-hidden">
            <div className="flex flex-col items-center gap-8">
                <div className="relative flex items-center justify-center animate-[spin_4s_linear_infinite]">
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl"></div>
                    <svg
                        className="text-blue-500 relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" />
                        <path d="M3.3 7L12 12l8.7-5" />
                        <path d="M12 22V12" />
                    </svg>
                </div>

                <div className="flex flex-col items-center gap-3 text-center z-10">
                    <h1 className="text-5xl font-extrabold tracking-tight opacity-0 animate-fade-up bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent drop-shadow-sm">
                        Wowfel
                    </h1>
                    <p className="text-lg font-medium text-zinc-400 opacity-0 animate-fade-up-delay">
                        Premium Hexagon Packages
                    </p>
                </div>
            </div>
        </main>
    );
}