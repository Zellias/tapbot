import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request) {
    try {
        const headersList = headers();
        const token = headersList.get('authorization')?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        const where = search ? {
            OR: [
                { user: {
                    name: { contains: search }
                }},
                { task: {
                    title: { contains: search }
                }}
            ]
        } : {};

        const doneTasks = await prisma.doneTasks.findMany({
            where,
            include: {
                user: true,
                task: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            doneTasks
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}
