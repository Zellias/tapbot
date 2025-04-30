import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendBaleMessage } from '@/lib/BaleLog';

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const userId = request.headers.get('x-user-id');
        const { cardNumber, amount } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'شناسه کاربر ارائه نشده است' }, { status: 400 });
        }

        if (!cardNumber || !amount) {
            return NextResponse.json({ error: 'شماره کارت و مبلغ الزامی است' }, { status: 400 });
        }

        // تبدیل مبلغ به عدد و اعتبارسنجی حداقل برداشت
        const withdrawalAmount = parseInt(amount);
        if (isNaN(withdrawalAmount) || withdrawalAmount < 60000) {
            return NextResponse.json({ 
                error: 'حداقل مبلغ برداشت ۶۰,۰۰۰ تومان است' 
            }, { status: 400 });
        }

        // دریافت اطلاعات کاربر و بررسی موجودی
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
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
        });

        if (!user) {
            return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
        }

        if (user.score < withdrawalAmount) {
            return NextResponse.json({ 
                error: 'موجودی ناکافی است' 
            }, { status: 400 });
        }

        // ایجاد سابقه پرداخت
        const payment = await prisma.payment.create({
            data: {
                userId: parseInt(userId),
                amount: withdrawalAmount,
                status: 'PENDING'
            }
        });

        // کسر مبلغ از امتیاز کاربر
        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                score: {
                    decrement: withdrawalAmount
                }
            }
        });

        // Send log to Bale
        const logMessage = `
🔄 New Withdrawal Request

👤 User Info:
ID: ${user.id}
Name: ${user.name || 'N/A'}
Current Score: ${user.score}
Total Payments: ${user.Payment.length}
Tasks Completed: ${user.DoneTasks.length}
Referrals Made: ${user.referralsAsReferrer.length}

💳 Withdrawal Details:
Amount: ${withdrawalAmount} Tomans
Card Number: ${cardNumber}
Status: PENDING

Payment ID: ${payment.id}
        `;

        await sendBaleMessage(logMessage);

        return NextResponse.json({
            success: true,
            message: 'درخواست برداشت با موفقیت ثبت شد',
            payment: payment
        });

    } catch (error) {
        console.error('خطا در پردازش برداشت:', error);
        return NextResponse.json({ 
            error: 'خطا در پردازش درخواست برداشت' 
        }, { status: 500 });
    }
}
