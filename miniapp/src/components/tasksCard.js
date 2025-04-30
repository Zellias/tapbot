"use client";

import { useState } from 'react';
import { Check, ExternalLink, Loader } from 'react-feather';
import useSdk from '@/hooks/useSdk';
import toast from 'react-hot-toast';

const TasksCard = ({ id, name, description, joinUrl, reward, processTask, loading }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const baleSdk = useSdk();

    const handleProcessTask = async () => {
        setIsProcessing(true);
        try {
            await processTask(id);
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
                            {reward} امتیاز به حساب شما اضافه شد
                        </p>
                    </div>
                </div>
            ), {
                duration: 3000,
                position: 'bottom-center'
            });
        } catch (error) {
            toast.custom((t) => (
                <div className={`
                    ${t.visible ? 'animate-enter' : 'animate-leave'}
                    max-w-md w-full bg-white/10 backdrop-blur-lg shadow-lg rounded-lg pointer-events-auto 
                    flex ring-1 ring-black ring-opacity-5 p-4 text-white
                `}>
                    <p className="text-sm text-red-400">
                        {error.message || 'خطایی رخ داد'}
                    </p>
                </div>
            ), {
                duration: 3000,
                position: 'bottom-center'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                flex flex-row-reverse items-center justify-between gap-4 p-4 rounded-lg
                bg-white/5 backdrop-blur-sm border border-white/10
                hover:bg-white/10 transition-all duration-300 ease-in-out
                ${isHovered ? 'scale-[1.02]' : 'scale-100'}
            `}
        >
            <div className="flex-1 text-right">
                <h3 className="text-lg font-medium text-white mb-1">{name}</h3>
                <p className="text-sm text-zinc-400">{description}</p>
                <p className="text-sm text-zinc-500 mt-1">امتیاز: {reward}</p>
            </div>

            <div className="flex gap-2">
                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={handleProcessTask}
                        disabled={loading || isProcessing}
                        className={`
                            flex items-center justify-center w-10 h-10
                            rounded-full transition-all duration-300
                            bg-white/10 hover:bg-white/20
                            group disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {loading || isProcessing ? (
                            <Loader 
                                size={20}
                                className="text-white animate-spin"
                            />
                        ) : (
                            <Check 
                                size={20} 
                                className={`
                                    transition-all duration-300
                                    text-white
                                    group-hover:scale-110
                                `}
                            />
                        )}
                    </button>
                    <span className="text-xs text-zinc-500">انجام شد</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={() => {
                            baleSdk.openLink(joinUrl, { try_instant_views: false })
                            baleSdk.close()
                        }}
                        className={`
                            flex items-center justify-center w-10 h-10
                            rounded-full bg-white/10 hover:bg-white/20
                            transition-all duration-300
                            group
                        `}
                    >
                        <ExternalLink size={20} className="text-white group-hover:scale-110 transition-transform" />
                    </button>
                    <span className="text-xs text-zinc-500">عضو شدن</span>
                </div>
            </div>
        </div>
    );
};

export default TasksCard;
