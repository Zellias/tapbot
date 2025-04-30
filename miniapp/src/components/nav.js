"use client";

import { Home, Search, Heart, User, DotsThree, CheckSquare,Award } from "react-feather";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Nav = () => {
    const pathname = usePathname();

    const menuItems = [
        { icon: Home, label: "خانه", href: "/" },
        { icon: Heart, label: "دوستان", href: "/friends" },
        { icon: CheckSquare, label: "تسک‌ها", href: "/tasks" },
        { icon: Award, label: "لیدربورد", href: "/leaderboard" },
    ];

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-8 px-8 py-4 rounded-t-xl bg-white/10 backdrop-blur-lg border-t border-x border-white/20 shadow-lg">
            {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                            }`}
                    >
                        <item.icon size={28} />
                        <span className="text-m">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default Nav;
