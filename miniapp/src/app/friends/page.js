"use client";
import Image from "next/image";
import Nav from "@/components/nav";
import FriendsCard from "@/components/friendsCard";
import InviteLink from "@/components/inviteLink";
import { useState, useEffect } from 'react';
import useSdk from "@/hooks/useSdk";
import useUser from "@/hooks/useUser";
import toast from 'react-hot-toast';
import { useRouter } from "next/navigation";

export default function Friends() {
    const router = useRouter();
    const [user] = useUser();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const sdk = useSdk();

    useEffect(() => {
        if (sdk) {
            if(sdk.isIframe){
                router.push("/mobile")
            }
        }
    }, [sdk]);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                // Try to get cached data first
                const cachedData = localStorage.getItem('userData');
                if (cachedData) {
                    const parsedData = JSON.parse(cachedData);
                    setUserData(parsedData);
                    setLoading(false);
                }

                // Fetch fresh data from API
                const response = await fetch('/api/user', {
                    headers: {
                        'X-USER-ID': user?.id
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const data = await response.json();

                // Update state and cache
                setUserData(data);
                localStorage.setItem('userData', JSON.stringify(data));
            } catch (error) {
                console.error('Error fetching user data:', error);
                toast.error('Failed to load user data');
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchUserData();
            // Set up interval to fetch data every 30 seconds
            const interval = setInterval(fetchUserData, 30000);
            
            // Cleanup interval on component unmount
            return () => clearInterval(interval);
        }
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-900 p-4">
                <div className="flex flex-col gap-4 mb-24">
                    <div className="min-h-screen bg-zinc-900 p-4 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                    </div>
                </div>
                <Nav />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-900 p-4">
            <div className="flex flex-col gap-4 mb-24">
                <InviteLink inviteUrl={`https://ble.ir/taprobot?start=${user?.id}`} />
                {userData?.user?.referralsAsReferrer?.map((referral, index) => (
                    <FriendsCard
                        key={referral.id}
                        avatar={referral.referedUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg"}
                        name={referral.referedUser.name || "کاربر ناشناس"}
                        score={referral.referedUser.score}
                    />
                ))}
            </div>
            <Nav />
        </div>
    );
}
