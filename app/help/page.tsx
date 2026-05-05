"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconHelpCircle, IconChevronDown, IconMail, IconMessageCircle2 } from "@tabler/icons-react";
import Navbar from "../../components/Navbar";

export default function HelpSupportPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const faqs = [
        {
            q: "How do I make a payment using Trakteer?",
            a: "When you checkout, you will receive an Order ID (e.g. ORD-1234). Click 'Pay with Trakteer' and paste this exact Order ID into the Support Message box. Your payment will be verified automatically!"
        },
        {
            q: "What if I forgot to put my Order ID in Trakteer?",
            a: "Don't worry! Go to your 'My Orders' page and click 'Upload Struk'. Upload a screenshot of your Trakteer payment receipt. Our admins will manually verify it within 24 hours."
        },
        {
            q: "How can I track my shipment?",
            a: "Once your order is verified and shipped, the status in 'My Orders' will be updated. We currently offer standard priority shipping on all items."
        },
        {
            q: "How can I become a seller?",
            a: "Go to your Settings page and select 'Role & Permissions'. Request a 'Seller' role. Once an admin approves it, you will see an 'Add Product' button on your dashboard."
        },
        {
            q: "Can I cancel my order?",
            a: "You can cancel any order that is in the 'Awaiting Payment' status from your 'My Orders' page. If you have already paid, please contact support for a refund."
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-neutral-900 flex flex-col pb-20">
            {/* Header */}
            <div className="bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 pt-10 pb-20 px-6 relative">
                <div className="max-w-3xl mx-auto flex items-center gap-4 text-white">
                    <Link href="/profile" className="p-2 hover:bg-white/20 rounded-full transition text-white">
                        <IconArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
                        <p className="text-blue-100 mt-1 text-sm md:text-base">We're here to help you with any issues.</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 -mt-10 relative z-10 flex flex-col gap-6">

                {/* Contact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="mailto:support@wowfel.com" className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4 hover:shadow-md transition group">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                            <IconMail size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-neutral-900">Email Support</h3>
                            <p className="text-sm text-neutral-500">support@wowfel.com</p>
                        </div>
                    </a>
                    <button className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4 hover:shadow-md transition group text-left">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                            <IconMessageCircle2 size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-neutral-900">Live Chat</h3>
                            <p className="text-sm text-neutral-500">Usually replies in 5m</p>
                        </div>
                    </button>
                </div>

                {/* FAQ Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden mt-4">
                    <div className="p-6 border-b border-neutral-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                            <IconHelpCircle size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900">Frequently Asked Questions</h2>
                            <p className="text-sm text-neutral-500">Quick answers to common issues</p>
                        </div>
                    </div>

                    <div className="p-2">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border-b border-neutral-100 last:border-0">
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full text-left px-4 py-4 flex items-center justify-between font-semibold text-neutral-800 hover:text-blue-600 transition"
                                >
                                    {faq.q}
                                    <IconChevronDown
                                        size={20}
                                        className={`text-neutral-400 transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-blue-500' : ''}`}
                                    />
                                </button>
                                <div
                                    className={`px-4 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <p className="text-sm text-neutral-600 leading-relaxed">
                                        {faq.a}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}
