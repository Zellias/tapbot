"use client";

import { useState } from 'react';
import { Copy, Check } from 'react-feather';

const InviteLink = ({ inviteUrl }) => {
    const [copied, setCopied] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const copyToClipboard = async () => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(inviteUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                return;
            }

            const textArea = document.createElement('textarea');
            textArea.value = inviteUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div
            onClick={copyToClipboard}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                flex flex-row-reverse items-center justify-between gap-4 p-4 rounded-lg 
                bg-white/5 backdrop-blur-sm border border-white/10
                hover:bg-white/10 hover:border-white/20
                transition-all duration-300 ease-in-out cursor-pointer
                ${isHovered ? 'scale-[1.02]' : 'scale-100'}
            `}
        >
            <div className="flex-1 text-right">
                <p className="text-zinc-300 text-sm mb-1">لینک دعوت</p>
                <p className="text-white font-medium truncate">{inviteUrl}</p>
                <p className="text-zinc-400 text-sm mt-1" dir='rtl'>با دعوت از دوستان خود 500 امتیاز دریافت کنید!</p>
            </div>

            <div className={`
                flex items-center justify-center w-10 h-10
                rounded-full bg-white/10 
                transition-all duration-300
                ${copied ? 'bg-green-500/20' : 'hover:bg-white/20'}
                group
            `}>
                {copied ? (
                    <Check size={20} className="text-green-500 animate-[checkmark_0.4s_ease-in-out]" />
                ) : (
                    <Copy size={20} className="text-white group-hover:scale-110 transition-transform" />
                )}
            </div>
        </div>
    );
};

export default InviteLink;
