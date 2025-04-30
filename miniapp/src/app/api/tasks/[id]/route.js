import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendBaleMessage } from '@/lib/BaleLog';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.BOT_TOKEN;

// Checks if a user is a member of a channel
async function userInChannel(chatId, userId) {
  const url = `https://tapi.bale.ai/bot${BOT_TOKEN}/getChatMember?chat_id=@${chatId}&user_id=${userId}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const membershipData = await response.json();
    return (
      membershipData.ok &&
      ['member', 'administrator', 'creator'].includes(membershipData.result.status)
    );
  } catch (error) {
    console.error('Error checking channel membership:', error);
    return false;
  }
}

// Checks if a user is a member of a bot
async function userInBot(uid, apiUrl) {
  try {
    const url = `${apiUrl}/check/?uid=${uid}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log('Bot membership check:', data);
    return data.ok;
  } catch (error) {
    console.error('Error checking bot membership:', error);
    return false;
  }
}

export async function POST(request, { params }) {
  let prismaDisconnectCalled = false;
  try {
    const { id: taskId } = params; // Destructure task id from params
    const userIdHeader = request.headers.get('x-user-id');
    if (!userIdHeader) {
      return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
    }
    const userId = parseInt(userIdHeader, 10);
    const taskIdNum = parseInt(taskId, 10);

    // Fetch task details and check for previous completion in parallel
    const [task, existingDoneTask] = await Promise.all([
      prisma.tasks.findUnique({ where: { id: taskIdNum } }),
      prisma.doneTasks.findFirst({
        where: { userId, taskId: taskIdNum }
      })
    ]);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Prevent multiple completions for the same task
    if (existingDoneTask) {
      return NextResponse.json(
        {
          success: false,
          message: 'Task already completed and cannot be done multiple times'
        },
        { status: 400 }
      );
    }

    // Extract chatId from task link (assumes the id is at the end of the URL)
    const chatId = task.link.split('/').pop().replace('@', '').replace('ble.ir/', '');

    // Check membership based on task type
    if (task.type === 'channel') {
      const isMember = await userInChannel(chatId, userId);
      if (!isMember) {
        return NextResponse.json(
          { success: false, message: 'شما عضو کانال نیستید' },
          { status: 403 }
        );
      }
    } else if (task.type === 'bot') {
      // Ensure the user has not already completed any bot tasks
      const existingBotTasks = await prisma.doneTasks.findMany({
        where: {
          userId,
          task: { type: 'bot' }
        }
      });
      if (existingBotTasks.length > 0) {
        return NextResponse.json(
          { success: false, message: 'شما قبلا یک تسک بات را انجام داده‌اید' },
          { status: 400 }
        );
      }
      const isMember = await userInBot(userId, task.value);
      if (!isMember) {
        return NextResponse.json(
          { success: false, message: 'شما عضو بات نیستید' },
          { status: 403 }
        );
      }
    } else if (task.type === 'referral') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const existingBotTasks = await prisma.doneTasks.findMany({
        where: {
          userId,
          taskId: task.id
        }
      });
      if (existingBotTasks.length > 0) {
        return NextResponse.json(
          { success: false, message: 'شما قبلا این تسک را انجام داده‌اید' },
          { status: 400 }
        );
      }

      // Check if the user has enough referrals in the last 3 hours
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

      const recentReferrals = await prisma.refferal.count({
        where: {
          refererId: userId,
          createdAt: {
            gte: threeHoursAgo
          }
        }
      });

      const requiredReferrals = parseInt(task.value, 10);

      if (recentReferrals < requiredReferrals) {
        return NextResponse.json(
          {
            success: false,
            message: `شما باید حداقل ${requiredReferrals} دعوت در ۳ ساعت گذشته داشته باشید`
          },
          { status: 403 }
        );
      }

    }

    // Atomically create a done task record and update the user score
    const [doneTask, updatedUser] = await prisma.$transaction([
      prisma.doneTasks.create({
        data: { userId, taskId: taskIdNum }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { score: { increment: task.reward } }
      })
    ]);

    // Log task completion
    const logMessage = `
✅ Task Completed

👤 User Info:
ID: ${userId}
Name: ${updatedUser.name || 'N/A'}
New Score: ${updatedUser.score}

📋 Task Details:
ID: ${task.id}
Channel: @${chatId}
Reward: ${task.reward} points
    `;
    await sendBaleMessage(logMessage);

    return NextResponse.json({
      success: true,
      message: 'تسک با موفقیت انجام شد',
      reward: task.reward
    });
  } catch (error) {
    console.error('Error processing task:', error);
    return NextResponse.json({ error: 'Failed to process task' }, { status: 500 });
  } finally {
    // Ensure the Prisma client disconnects once the operation is complete.
    if (!prismaDisconnectCalled) {
      await prisma.$disconnect();
    }
  }
}
