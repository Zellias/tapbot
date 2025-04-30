"use client";
import { useState, useEffect } from "react";
import Nav from "@/components/nav";
import useUser from "@/hooks/useUser";
import useSdk from "@/hooks/useSdk";
import { Toaster, toast } from 'react-hot-toast';

export default function Mobile() {
    const [user] = useUser();
    const sdk = useSdk();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sdk) {
            setLoading(false);
            if (!sdk.isIframe) {
                window.location.href = "/";
            }
        }
    }, [sdk]);

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-zinc-900">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-zinc-900 relative">
            <Toaster position="bottom-center" />
            
            <div className="flex items-center justify-center min-h-screen px-4 py-6 sm:px-6 lg:px-8">
                <div className="w-full max-w-md mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-xl p-6 sm:p-8 transform transition-all hover:scale-[1.02]">
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">⚠️ هشدار</h1>
                            <div className="space-y-4">
                                <p className="text-lg sm:text-xl text-zinc-300">
                                    لطفا این بازو را در موبایل خود باز کنید.
                                </p>
                                <p className="text-sm sm:text-base text-zinc-400">
                                    برای تجربه بهتر و دسترسی به تمام امکانات، لطفا بازو را در موبایل خود باز کنید.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

   
        </div>
    );
}
