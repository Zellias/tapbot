import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
    try {
        // Get the token from the Authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

        // Verify the token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return NextResponse.json({ 
                valid: true,
                user: decoded
            });
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                return NextResponse.json({ 
                    valid: false,
                    error: 'Token expired' 
                }, { status: 401 });
            }
            
            return NextResponse.json({ 
                valid: false,
                error: 'Invalid token'
            }, { status: 401 });
        }

    } catch (error) {
        return NextResponse.json({ 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}
