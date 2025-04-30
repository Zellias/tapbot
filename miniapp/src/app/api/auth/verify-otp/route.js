import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// JWT secret key - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-jwt-secret-key';

export async function POST(request) {
    try {
        const { otp } = await request.json();

        if (!otp) {
            return NextResponse.json({
                type: 2,
                code: 10,
                message: "OTP is required"
            }, { status: 400 });
        }

        // Get latest OTP from last 2 minutes
        const latestOtp = await prisma.otp.findFirst({
            where: {
                otp: otp,
                createdAt: {
                    gte: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!latestOtp) {
            return NextResponse.json({
                type: 2, 
                code: 11,
                message: "Invalid or expired OTP"
            }, { status: 400 });
        }

        // Delete the used OTP
        await prisma.otp.delete({
            where: {
                id: latestOtp.id
            }
        });

        // Generate JWT token with strong security settings
        const token = jwt.sign(
            {
                // Add claims that identify the admin
                role: 'admin',
                iat: Math.floor(Date.now() / 1000),
            },
            JWT_SECRET,
            {
                expiresIn: '24h', // Token expires in 24 hours
                algorithm: 'HS512' // Using a stronger algorithm
            }
        );

        // Return success with JWT token
        return NextResponse.json({
            success: true,
            token: token
        });

    } catch (error) {
        console.error('Error in OTP verification:', error);
        return NextResponse.json({
            type: 1,
            code: 2,
            message: "internal server error occurred"
        }, { status: 500 });
    }
}
