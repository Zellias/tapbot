import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function DELETE(request, { params }) {
    try {
        const headersList = headers();
        const token = headersList.get('authorization')?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role !== 'admin') {
                return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
            }
        } catch (err) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const taskId = parseInt(params.taskid);

        // First delete all related DoneTasks
        await prisma.doneTasks.deleteMany({
            where: {
                taskId: taskId
            }
        });

        // Then delete the task itself
        const deletedTask = await prisma.tasks.delete({
            where: {
                id: taskId
            }
        });

        return NextResponse.json(deletedTask, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}
