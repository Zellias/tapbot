import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Rate limiting storage (in-memory)
const rateLimits = {
    phones: new Map(), // Store phone attempts
    lastCleanup: Date.now()
};

// Clean up rate limiting data every hour
function cleanupRateLimits() {
    const now = Date.now();
    if (now - rateLimits.lastCleanup > 3600000) { // 1 hour
        rateLimits.phones.clear();
        rateLimits.lastCleanup = now;
    }
}

// Check rate limits for a phone number
function checkRateLimit(phone) {
    cleanupRateLimits();
    
    const attempts = rateLimits.phones.get(phone) || [];
    const hourAgo = Date.now() - 3600000;
    
    // Filter attempts within last hour
    const recentAttempts = attempts.filter(time => time > hourAgo);
    
    if (recentAttempts.length >= 30) {
        return false;
    }
    
    // Update attempts
    rateLimits.phones.set(phone, [...recentAttempts, Date.now()]);
    return true;
}

// Validate phone number format
function isValidPhone(phone) {
    return /^989\d{9}$/.test(phone);
}

// Generate OTP
function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

// Get Bale API token
async function getBaleToken() {
    try {
        const response = await fetch('https://safir.bale.ai/api/v2/auth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_secret: "mRCZaDbWuXwUxcMUMXdlIayaEmgTaVok",
                scope: 'read',
                client_id: "fotqAAAAqdmkRMUXHlabPCHdVyxVeQaH"
            })
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error getting Bale token:', error);
        throw error;
    }
}

// Send OTP via Bale API
async function sendOTPViaBale(phone, otp) {
    const token = await getBaleToken();
    
    const response = await fetch('https://safir.bale.ai/api/v2/send_otp', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            phone: phone,
            otp: parseInt(otp)
        })
    });

    return response.json();
}

// Verify hCaptcha token
async function verifyHCaptcha(token) {
    const secret = process.env.SECRET_KEY;
    
    const response = await fetch('https://api.hcaptcha.com/siteverify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            response: token,
            secret: secret,
        }),
    });

    const data = await response.json();
    return data.success;
}

export async function POST(request) {
    try {
        const { captchaToken } = await request.json();

        if (!captchaToken) {
            return NextResponse.json({ error: 'CAPTCHA verification required' }, { status: 400 });
        }

        // Verify hCaptcha token
        const isValidCaptcha = await verifyHCaptcha(captchaToken);
        if (!isValidCaptcha) {
            return NextResponse.json({ error: 'Invalid CAPTCHA token' }, { status: 400 });
        }

        // For demo, using a fixed test phone number - in production this would come from authenticated user
        const phone = process.env.PHONE_NUMBER;

        // Validate phone format
        if (!isValidPhone(phone)) {
            return NextResponse.json({ 
                type: 2,
                code: 8,
                message: "provided phone number is not valid"
            }, { status: 400 });
        }

        // Check rate limits
        if (!checkRateLimit(phone)) {
            return NextResponse.json({
                type: 2,
                code: 18, 
                message: "rate limit exceeded"
            }, { status: 429 });
        }

        // Generate OTP
        const otp = generateOTP();

        // Store OTP in database
        await prisma.otp.create({
            data: {
                otp: otp,
            }
        });

        // Send OTP via Bale API
        const baleResponse = await sendOTPViaBale(phone, otp);

        // Return balance from Bale response
        return NextResponse.json({ 
            balance: baleResponse.balance
        });

    } catch (error) {
        console.error('Error in OTP request:', error);
        
        // Handle specific Bale API errors
        if (error.type === 3 && error.code === 17) {
            return NextResponse.json({
                type: 3,
                code: 17,
                message: "this phone does not have an account in Bale"
            }, { status: 404 });
        }
        
        if (error.type === 2 && error.code === 20) {
            return NextResponse.json({
                type: 2,
                code: 20,
                message: "payment required"
            }, { status: 402 });
        }

        return NextResponse.json({
            type: 1,
            code: 2,
            message: "internal server error occurred"
        }, { status: 500 });
    }
}
