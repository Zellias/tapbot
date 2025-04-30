"use client";
import Image from "next/image";
import Nav from "@/components/nav";
import LeaderBoardCard from "@/components/leaderBoardCard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSdk from "@/hooks/useSdk";

export default function Leaderboard() {
    const router = useRouter();
    const sdk = useSdk();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPlayers, setTotalPlayers] = useState(0);

    useEffect(() => {
        if (sdk) {
            if (sdk.isIframe) {
                router.push("/mobile")
            }
        }
    }, [sdk, router]);

    const fetchLeaderboard = async () => {
        try {
            // Try to get cached data first
            if (typeof window !== 'undefined') {
                const cachedData = localStorage.getItem('leaderboardData');
                if (cachedData) {
                    const parsedData = JSON.parse(cachedData);
                    setLeaderboard(parsedData);
                    setLoading(false);
                }
            }

            // Fetch fresh data from API
            const response = await fetch('/api/leaderboard');

            const data = await response.json();

            if (data.success) {
                // Update state and cache
                setLeaderboard(data.data);
                setTotalPlayers(data.totalPlayers);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('leaderboardData', JSON.stringify(data.data));
                }
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();

        // Set up interval to fetch data every 30 seconds
        const interval = setInterval(() => {
            fetchLeaderboard();
        }, 30000);

        // Clean up interval on component unmount
        return () => clearInterval(interval);
    }, []);

    const getRankEmoji = (rank) => {
        switch (rank) {
            case 1:
                return "👑";
            case 2:
                return "🥈";
            case 3:
                return "🥉";
            default:
                return rank;
        }
    };

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
                <h1 className="text-2xl font-bold text-white text-center mb-6">برترین‌ها</h1>
                <p className="text-sm text-gray-400 mt-2 text-center">تعداد کل کاربران: {totalPlayers}</p>
                {leaderboard.map((user, index) => (
                    <LeaderBoardCard
                        key={index}
                        avatar={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg"}
                        name={user.name || "کاربر ناشناس"}
                        score={user.score}
                        rank={getRankEmoji(index + 1)}
                    />
                ))}
            </div>
            <Nav />
        </div>
    );
}
