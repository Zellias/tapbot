import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(request) {
    try {
        const headersList = headers();
        const token = headersList.get('authorization');

        if (token !== 'ipwqhf309fh309e3209ek230rfh320rhj') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [users, tasks] = await Promise.all([
            prisma.user.findMany({
                include: {
                    Payment: true,
                    DoneTasks: {
                        include: {
                            task: true
                        }
                    },
                    referralsAsReferrer: true,
                    referralsAsReferred: true
                }
            }),
            prisma.tasks.findMany({
                include: {
                    DoneTasks: {
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        ]);

        return NextResponse.json({
            users,
            tasks
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}
