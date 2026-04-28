"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    IconArrowLeft, IconUser, IconPalette, IconCreditCard,
    IconUpload, IconCheck, IconShieldLock
} from "@tabler/icons-react";
import Navbar from "../../components/Navbar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");
    const [imagePreview, setImagePreview] = useState("");
    const [imageUrlInput, setImageUrlInput] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [requestingRole, setRequestingRole] = useState(false);
    const [selectedRoleRequest, setSelectedRoleRequest] = useState("seller");
    const [trakteerUrl, setTrakteerUrl] = useState("");
    const [savingTrakteer, setSavingTrakteer] = useState(false);

    const [theme, setTheme] = useState("light");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.replace("/login");
                return;
            }
            setUser(currentUser);
            setImagePreview(currentUser.photoURL || "");
            setImageUrlInput(currentUser.photoURL || "");

            try {
                const userRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setUserData(data);
                    if (data.trakteerUrl) setTrakteerUrl(data.trakteerUrl);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        });

        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === "dark") {
                document.documentElement.classList.add('dark');
            }
        }

        return () => unsubscribe();
    }, [router]);

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        if (newTheme === "dark") {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleImageUpload = async () => {
        if ((!imageUrlInput && !imageFile) || !user) return;
        setUploadingImage(true);
        try {
            let finalUrl = imageUrlInput;

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
                    throw new Error("Failed to upload image to Cloudinary");
                }

                const data = await response.json();
                finalUrl = data.secure_url;
            }

            if (!finalUrl) {
                throw new Error("No image URL provided");
            }

            await updateProfile(user, { photoURL: finalUrl });
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { photoURL: finalUrl });

            setImagePreview(finalUrl);
            setImageUrlInput(finalUrl);
            setImageFile(null);
            toast.success("Profile picture updated!");
        } catch (error) {
            console.error("Error updating image:", error);
            toast.error("Failed to update image. Check Cloudinary settings.");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRequestRole = async () => {
        if (!user) return;
        setRequestingRole(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                requestedRole: selectedRoleRequest
            });
            setUserData({ ...userData, requestedRole: selectedRoleRequest });
            toast.success(`Role upgrade to ${selectedRoleRequest} requested!`);
        } catch (error) {
            console.error("Error requesting role:", error);
            toast.error("Failed to request role.");
        } finally {
            setRequestingRole(false);
        }
    };

    const handleSaveTrakteerUrl = async () => {
        if (!user) return;
        setSavingTrakteer(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { trakteerUrl });
            setUserData({ ...userData, trakteerUrl });
            toast.success("Trakteer URL saved!");
        } catch (error) {
            console.error("Error saving Trakteer URL:", error);
            toast.error("Failed to save Trakteer URL.");
        } finally {
            setSavingTrakteer(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-neutral-900 dark:text-neutral-100 flex flex-col pb-20 transition-colors duration-200">
            <header className="bg-white dark:bg-slate-800 border-b border-neutral-100 dark:border-slate-700 px-6 py-4 sticky top-0 z-40 transition-colors duration-200">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <Link href="/profile" className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition text-neutral-600 dark:text-neutral-300">
                        <IconArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage your account preferences</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col md:flex-row gap-8">

                <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-600 dark:text-neutral-400'}`}
                    >
                        <IconUser size={20} /> My Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'appearance' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-600 dark:text-neutral-400'}`}
                    >
                        <IconPalette size={20} /> Appearance
                    </button>
                </div>

                <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-slate-700 transition-colors duration-200">

                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-xl font-bold mb-4">Profile Picture</h2>
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-slate-700 overflow-hidden shrink-0 border border-neutral-200 dark:border-slate-600 flex items-center justify-center">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <IconUser size={32} className="text-neutral-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-col gap-3">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setImageFile(e.target.files[0]);
                                                        setImagePreview(URL.createObjectURL(e.target.files[0]));
                                                        setImageUrlInput(""); 
                                                    }
                                                }}
                                                className="block w-full text-sm text-neutral-500 dark:text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-700 dark:file:text-blue-400 transition"
                                            />
                                            <div className="text-xs font-medium text-neutral-400 uppercase tracking-widest pl-2">OR Paste URL</div>
                                            <input
                                                type="text"
                                                placeholder="https://example.com/image.png"
                                                value={imageUrlInput}
                                                onChange={(e) => {
                                                    setImageUrlInput(e.target.value);
                                                    setImageFile(null); 
                                                    if (e.target.value) setImagePreview(e.target.value);
                                                }}
                                                className="block w-full bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none"
                                            />
                                        </div>
                                        {(imageUrlInput || imageFile) && ((imageUrlInput !== user?.photoURL && !imageFile) || imageFile) && (
                                            <button
                                                onClick={handleImageUpload}
                                                disabled={uploadingImage}
                                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                                            >
                                                {uploadingImage ? "Uploading..." : <><IconUpload size={16} /> Save Picture</>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <hr className="border-neutral-100 dark:border-slate-700" />

                            <div>
                                <h2 className="text-xl font-bold mb-4">Role & Permissions</h2>
                                <div className="bg-neutral-50 dark:bg-slate-700/50 p-6 rounded-2xl border border-neutral-100 dark:border-slate-600">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="font-semibold">Current Role:</span>
                                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider">
                                            {userData.role || 'customer'}
                                        </span>
                                    </div>

                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                        Want to sell items or help moderate? Request a role upgrade here. Admins will review your request.
                                    </p>

                                    {userData.requestedRole ? (
                                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                            <IconShieldLock size={20} />
                                            <span>You have a pending request for: <strong>{userData.requestedRole}</strong></span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={selectedRoleRequest}
                                                onChange={(e) => setSelectedRoleRequest(e.target.value)}
                                                className="bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-600 rounded-xl px-4 py-2 outline-none focus:border-blue-500 dark:text-white"
                                            >
                                                <option value="seller">Seller Account</option>
                                                <option value="admin">Administrator</option>
                                            </select>
                                            <button
                                                onClick={handleRequestRole}
                                                disabled={requestingRole}
                                                className="bg-neutral-900 dark:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-neutral-800 dark:hover:bg-blue-700 transition disabled:opacity-50"
                                            >
                                                {requestingRole ? "Sending..." : "Request Upgrade"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {userData.role && userData.role !== 'customer' && (
                                <>
                                    <hr className="border-neutral-100 dark:border-slate-700" />
                                    <div>
                                        <h2 className="text-xl font-bold mb-4">Payment Settings</h2>
                                        <div className="bg-neutral-50 dark:bg-slate-700/50 p-6 rounded-2xl border border-neutral-100 dark:border-slate-600">
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                                Enter your Trakteer URL to receive payments directly.
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="url"
                                                    placeholder="https://trakteer.id/your-username"
                                                    value={trakteerUrl}
                                                    onChange={(e) => setTrakteerUrl(e.target.value)}
                                                    className="flex-1 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-600 rounded-xl px-4 py-2 outline-none focus:border-blue-500 dark:text-white"
                                                />
                                                <button
                                                    onClick={handleSaveTrakteerUrl}
                                                    disabled={savingTrakteer}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    {savingTrakteer ? "Saving..." : "Save URL"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-bold mb-4">Theme Preferences</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleThemeChange('light')}
                                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-neutral-200 dark:border-slate-700 hover:border-blue-300'}`}
                                >
                                    <div className="w-16 h-16 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center">
                                        {theme === 'light' && <IconCheck className="text-blue-500" />}
                                    </div>
                                    <span className="font-semibold">Light Mode</span>
                                </button>

                                <button
                                    onClick={() => handleThemeChange('dark')}
                                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-neutral-200 dark:border-slate-700 hover:border-blue-300'}`}
                                >
                                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                                        {theme === 'dark' && <IconCheck className="text-blue-500" />}
                                    </div>
                                    <span className="font-semibold">Dark Mode</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
