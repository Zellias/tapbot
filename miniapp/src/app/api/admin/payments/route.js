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
                { user: {
                    name: { contains: search, mode: 'insensitive' }
                }},
                { user: {
                    email: { contains: search, mode: 'insensitive' }
                }},
                { transactionId: { contains: search, mode: 'insensitive' }}
            ]
        } : {};

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                include: {
                    user: true
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.payment.count({ where })
        ]);

        return NextResponse.json({
            payments,
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
