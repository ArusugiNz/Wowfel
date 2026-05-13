"use client";

import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconPhoto, IconDeviceFloppy } from "@tabler/icons-react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import Toast from "../../components/Toast";

export default function AddProductPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [description, setDescription] = useState("");
    const [trakteerUrl, setTrakteerUrl] = useState("");
    const [image, setImage] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !price || !stock) {
            alert("Name, Price, dan Stock wajib diisi.");
            return;
        }

        if (!auth.currentUser) {
            alert("User belum login.");
            return;
        }

        setLoading(true);

        try {
            let finalImageUrl = image || "https://images.unsplash.com/photo-1627989580309-bfaf3e58af6f?q=80&w=2671&auto=format&fit=crop";

            if (imageFile) {
                const formData = new FormData();
                formData.append("file", imageFile);
                formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");

                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Cloudinary error:", errorText);
                    throw new Error(`Failed to upload image to Cloudinary. Please check if NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET are set correctly in your Railway environment variables and redeploy. Details: ${errorText}`);
                }

                const data = await response.json();
                finalImageUrl = data.secure_url;
            }

            console.log("Current user:", auth.currentUser);

            const docRef = await addDoc(collection(db, "products"), {
                name,
                price: parseFloat(price),
                stock: parseInt(stock, 10),
                description:
                    description ||
                    "Modern designer hexagon package with metallic accents. Features a unique opening mechanism.",
                image: finalImageUrl,
                sellerId: auth.currentUser.uid,
                trakteerUrl: trakteerUrl || null,
                createdAt: new Date(),
            });

            console.log("Product added with ID:", docRef.id);

            setShowToast(true);

            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (error: any) {
            console.error("Firebase Error:", error);
            alert("Gagal menambahkan produk: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-neutral-900 dark:text-neutral-100 pb-20 transition-colors duration-200">
            <Toast show={showToast} message="Product added successfully!" />

            <header className="bg-white dark:bg-slate-800 border-b border-neutral-100 dark:border-slate-700 px-6 py-4 sticky top-0 z-40 transition-colors duration-200">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition text-neutral-600 dark:text-neutral-400"
                    >
                        <IconArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            Add New Product
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Create a new hexagon package listing
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-8">
                <form
                    onSubmit={handleAdd}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-slate-700 transition-colors duration-200"
                >
                    <div className="space-y-6">

                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">
                                Product Image URL
                            </label>

                            <div className="flex items-start gap-4">
                                <div className="w-24 h-24 rounded-2xl bg-neutral-100 dark:bg-slate-700 overflow-hidden border border-neutral-200 dark:border-slate-600 shrink-0 flex items-center justify-center text-neutral-400">
                                    {image ? (
                                        <img
                                            src={image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) =>
                                            (e.currentTarget.src =
                                                "https://images.unsplash.com/photo-1627989580309-bfaf3e58af6f?q=80&w=2671&auto=format&fit=crop")
                                            }
                                        />
                                    ) : (
                                        <IconPhoto size={32} stroke={1.5} />
                                    )}
                                </div>

                                <div className="w-full flex items-center gap-4">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setImageFile(e.target.files[0]);
                                                setImage(URL.createObjectURL(e.target.files[0]));
                                            }
                                        }}
                                        className="w-1/2 bg-slate-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl px-4 py-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-700 dark:file:text-blue-400 dark:text-white"
                                    />
                                    <span className="text-xs text-neutral-400 font-bold">OR</span>
                                    <input
                                        type="text"
                                        placeholder="https://example.com/image.png"
                                        value={imageFile ? "Custom File Selected" : image}
                                        disabled={!!imageFile}
                                        onChange={(e) => setImage(e.target.value)}
                                        className="w-1/2 bg-slate-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl px-4 py-3 disabled:opacity-50 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">
                                Product Name *
                            </label>
                            <input
                                required
                                placeholder="e.g. Midnight Onyx Hexagon"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl px-4 py-3 dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">
                                    Price (Rp) *
                                </label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl px-4 py-3 dark:text-white"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">
                                    Initial Stock *
                                </label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl px-4 py-3 dark:text-white"
                                />
                            </div>

                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">
                                Description
                            </label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl px-4 py-3 dark:text-white"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">
                                Custom Trakteer URL (Optional)
                            </label>
                            <input
                                type="url"
                                placeholder="https://trakteer.id/your-username"
                                value={trakteerUrl}
                                onChange={(e) => setTrakteerUrl(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl px-4 py-3 dark:text-white"
                            />
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">If left empty, we will use the default Trakteer URL from your profile settings.</p>
                        </div>

                    </div>

                    <hr className="border-neutral-100 dark:border-slate-700 my-8" />

                    <div className="flex justify-end gap-3">

                        <Link
                            href="/dashboard"
                            className="px-6 py-3 rounded-xl font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-700 transition"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition text-white px-8 py-3 rounded-xl disabled:opacity-70"
                        >
                            <IconDeviceFloppy size={20} />
                            {loading ? "Saving..." : "Save Product"}
                        </button>

                    </div>
                </form>
            </main>
        </div>
    );
}