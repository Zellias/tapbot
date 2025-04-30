import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!user) {
            return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
        }

        // Check if user has enough score
        if (user.score < 1000) {
            return NextResponse.json({ error: 'امتیاز کافی ندارید' }, { status: 400 });
        }

        // Check if user has spun in last 24 hours
        if (user.lastSpin) {
            const lastSpinTime = new Date(user.lastSpin);
            const now = new Date();
            const hoursSinceLastSpin = (now - lastSpinTime) / (1000 * 60 * 60);

            if (hoursSinceLastSpin < 24) {
                return NextResponse.json({ error: 'شما هر ۲۴ ساعت یکبار می‌توانید شانس خود را امتحان کنید' }, { status: 400 });
            }
        }
        
        // Generate random prize with 70% chance of 0
        let prize = 0;
        const random = Math.random();
        if (random > 0.5) { // 50% chance to win non-zero prize
            const prizes = [1000, 2000, 3000, 4000];
            prize = prizes[Math.floor(Math.random() * prizes.length)];
        }

        // Update user score and last spin time
        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                score: user.score - 1000 + prize, // Deduct cost and add prize
                lastSpin: new Date()
            }
        });

        return NextResponse.json({ prize });

    } catch (error) {
        console.error('Error in spin route:', error);
        return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
    }
}
