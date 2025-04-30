import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { sendBaleMessage } from '@/lib/BaleLog';
const prisma = new PrismaClient();

export async function GET() {
    try {
        // Get total number of players
        const totalPlayers = await prisma.user.count();

        // Get top 100 users ordered by score
        const topPlayers = await prisma.user.findMany({
            select: {
                name: true,
                score: true,
                avatar: true
            },
            orderBy: {
                score: 'desc'
            },
            take: 100
        });
        return NextResponse.json({
            success: true,
            data: topPlayers,
            totalPlayers
        });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}
