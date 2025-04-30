"use client";
import Image from "next/image";
import Nav from "@/components/nav";
import TasksCard from "@/components/tasksCard";
import ScoreText from "@/components/scoreText";
import useSdk from "@/hooks/useSdk";
import useUser from "@/hooks/useUser";
import { useState, useEffect } from 'react';
import { Check } from 'react-feather';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from "next/navigation";

export default function Tasks() {
    const router = useRouter();
    const [user] = useUser();
    const sdk = useSdk();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');

    useEffect(() => {
        if (sdk) {
            if(sdk.isIframe){
                router.push("/mobile")
            }
        }
    }, [sdk]);

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

    useEffect(() => {
        if (user?.id) {
            fetchUserData();
            // Set up interval to fetch data every 30 seconds
            const interval = setInterval(fetchUserData, 30000);
            
            // Cleanup interval on unmount
            return () => clearInterval(interval);
        }
    }, [user]);

    // Filter out completed tasks
    const incompleteTasks = userData?.tasks?.filter(task =>
        !userData?.user?.DoneTasks?.some(doneTask => doneTask.taskId === task.id)
    ) || [];

    // Categorize tasks
    const categorizedTasks = {
        all: incompleteTasks,
        channel: incompleteTasks.filter(task => task.type === 'channel'),
        bot: incompleteTasks.filter(task => task.type === 'bot'),
        referral: incompleteTasks.filter(task => task.type === 'referral')
    };

    const displayTasks = categorizedTasks[activeCategory] || [];

    const processTask = async (taskId) => {
        try {
            setIsProcessing(true);
            
            if (!userData?.user?.id) {
                throw new Error('User not found');
            }

            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-USER-ID': userData.user.id
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to process task');
            }

            if (data.success) {
                toast.custom((t) => (
                    <div className={`
                        ${t.visible ? 'animate-enter' : 'animate-leave'}
                        max-w-md w-full bg-white/10 backdrop-blur-lg shadow-lg rounded-lg pointer-events-auto 
                        flex ring-1 ring-black ring-opacity-5 p-4 text-white
                    `}>
                        <div className="flex-1 w-0">
                            <div className="flex items-center gap-2">
                                <Check className="h-6 w-6 text-green-500" />
                                <p className="text-sm font-medium">
                                    تسک با موفقیت انجام شد
                                </p>
                            </div>
                            <p className="mt-1 text-sm text-gray-300">
                                {data.reward} امتیاز به حساب شما اضافه شد
                            </p>
                        </div>
                    </div>
                ), {
                    duration: 3000,
                    position: 'bottom-center'
                });

                // Refetch user data to update the UI
                const updatedResponse = await fetch('/api/user', {
                    headers: {
                        'X-USER-ID': user?.id
                    }
                });

                if (!updatedResponse.ok) {
                    throw new Error('Failed to refresh user data');
                }

                const updatedData = await updatedResponse.json();
                setUserData(updatedData);
                localStorage.setItem('userData', JSON.stringify(updatedData));

                return data.reward;
            }

            throw new Error(data.message || 'Failed to complete task');

        } catch (error) {
            console.error('Error processing task:', error);
            toast.custom((t) => (
                <div className={`
                    ${t.visible ? 'animate-enter' : 'animate-leave'}
                    max-w-md w-full bg-white/10 backdrop-blur-lg shadow-lg rounded-lg pointer-events-auto 
                    flex ring-1 ring-black ring-opacity-5 p-4 text-white
                `}>
                    <p className="text-sm text-red-400">
                        {error.message}
                    </p>
                </div>
            ), {
                duration: 3000,
                position: 'bottom-center'
            });
            throw error;
        } finally {
            setIsProcessing(false);
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
                <Toaster />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-900 p-4">
            <div className="flex flex-col gap-4 mb-24">
                <ScoreText value={userData?.user?.score || 0} />
                
                {/* Category Tabs */}
                <div className="flex justify-between bg-zinc-800 rounded-lg p-1 mb-4">
                    <button 
                        className={`py-2 px-3 rounded-md text-sm font-medium ${activeCategory === 'all' ? 'bg-zinc-700 text-white' : 'text-gray-400'}`}
                        onClick={() => setActiveCategory('all')}
                    >
                        همه
                    </button>
                    <button 
                        className={`py-2 px-3 rounded-md text-sm font-medium ${activeCategory === 'channel' ? 'bg-zinc-700 text-white' : 'text-gray-400'}`}
                        onClick={() => setActiveCategory('channel')}
                    >
                        کانال ها
                    </button>
                    <button 
                        className={`py-2 px-3 rounded-md text-sm font-medium ${activeCategory === 'bot' ? 'bg-zinc-700 text-white' : 'text-gray-400'}`}
                        onClick={() => setActiveCategory('bot')}
                    >
                        ربات ها
                    </button>
                    <button 
                        className={`py-2 px-3 rounded-md text-sm font-medium ${activeCategory === 'referral' ? 'bg-zinc-700 text-white' : 'text-gray-400'}`}
                        onClick={() => setActiveCategory('referral')}
                    >
                        زیرمجموعه گیری
                    </button>
                </div>
                
                {displayTasks.length > 0 ? (
                    displayTasks.map((task) => (
                        <TasksCard
                            id={task.id}
                            key={task.id}
                            name={task.title}
                            description={task.description}
                            joinUrl={task.link}
                            reward={task.reward}
                            processTask={processTask}
                            loading={isProcessing}
                        />
                    ))
                ) : (
                    <div className="text-center text-white mt-8">
                        {activeCategory === 'all' 
                            ? 'شما همه تسک های موجود رو انجام دادید' 
                            : `تسکی در دسته ${
                                activeCategory === 'channel' ? 'کانال ها' : 
                                activeCategory === 'bot' ? 'ربات ها' : 
                                'زیرمجموعه گیری'
                              } وجود ندارد`
                        }
                    </div>
                )}
            </div>
            <Nav />
            <Toaster />
        </div>
    );
}
