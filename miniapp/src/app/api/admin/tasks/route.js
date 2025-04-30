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
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        
        const skip = (page - 1) * limit;

        const where = search ? {
            OR: [
                { title: { contains: search } },
                { description: { contains: search } }
            ]
        } : {};

        const [tasks, total] = await Promise.all([
            prisma.tasks.findMany({
                where,
                include: {
                    DoneTasks: {
                        include: {
                            user: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.tasks.count({ where })
        ]);

        return NextResponse.json({
            tasks,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const headersList = headers();
        const token = headersList.get('authorization')?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decoded);
            if (decoded.role !== 'admin') {
                return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
            }
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, reward, link, type, value } = body;

        const task = await prisma.tasks.create({
            data: {
                title,
                description,
                reward: parseInt(reward),
                link,
                type,
                value
            }
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}
