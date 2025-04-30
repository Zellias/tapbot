import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { sendBaleMessage } from '@/lib/BaleLog'

const prisma = new PrismaClient()
const BOT_TOKEN = process.env.BOT_TOKEN

async function getUserInfo(userId) {
    try {
        const response = await fetch(`https://tapi.bale.ai/bot${BOT_TOKEN}/getChat?chat_id=${userId}`)
        const data = await response.json()
        return data.ok ? data.result : null
    } catch (error) {
        console.error('Error fetching user info from Bale:', error)
        return null
    }
}

export async function GET(request) {
    try {
        const userId = request.headers.get('X-USER-ID')

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // Get all available tasks
        const tasks = await prisma.tasks.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        let user = await prisma.user.findUnique({
            where: {
                id: parseInt(userId)
            },
            include: {
                Payment: true,
                DoneTasks: {
                    include: {
                        task: true
                    }
                },
                referralsAsReferrer: {
                    include: {
                        referedUser: true
                    }
                },
                referralsAsReferred: {
                    include: {
                        refererUser: true
                    }
                }
            }
        })

        const baleUserInfo = await getUserInfo(userId)

        if (!user) {
            const refId = request.headers.get('X-REF-ID');
            let referralData = {};
            
            if (refId) {
                // Check if referrer exists
                const referrer = await prisma.user.findUnique({
                    where: {
                        id: parseInt(refId)
                    }
                });
                
                if (referrer) {
                    referralData = {
                        referralsAsReferred: {
                            create: {
                                refererId: parseInt(refId)
                            }
                        }
                    };

                    // Add 1000 score to referrer
                    await prisma.user.update({
                        where: {
                            id: parseInt(refId)
                        },
                        data: {
                            score: {
                                increment: 500
                            }
                        }
                    });
                }
            }

            user = await prisma.user.create({
                data: {
                    id: parseInt(userId),
                    score: 0,
                    name: baleUserInfo?.first_name || null,
                    avatar: baleUserInfo?.photo?.small_file_id || null,
                    ...referralData
                },
                include: {
                    Payment: true,
                    DoneTasks: {
                        include: {
                            task: true
                        }
                    },
                    referralsAsReferrer: {
                        include: {
                            referedUser: true
                        }
                    },
                    referralsAsReferred: {
                        include: {
                            refererUser: true
                        }
                    }
                }
            });

            // Send log for new user creation
            const logMessage = `
👤 New User Created

User Info:
ID: ${user.id}
Name: ${user.name || 'N/A'}
Avatar: ${user.avatar ? 'Yes' : 'No'}
${refId ? `Referred by: ${refId} (${referralData.referralsAsReferred ? 'Valid' : 'Invalid'} referrer)` : 'No referral'}
            `;
            await sendBaleMessage(logMessage);

        } else if (baleUserInfo) {
            // Update existing user with latest Bale info
            user = await prisma.user.update({
                where: {
                    id: parseInt(userId)
                },
                data: {
                    name: baleUserInfo.first_name || user.firstName,
                    avatar: baleUserInfo.photo?.small_file_id || user.photo
                },
                include: {
                    Payment: true,
                    DoneTasks: {
                        include: {
                            task: true
                        }
                    },
                    referralsAsReferrer: {
                        include: {
                            referedUser: true
                        }
                    },
                    referralsAsReferred: {
                        include: {
                            refererUser: true
                        }
                    }
                }
            })
        }

        return NextResponse.json({
            user,
            tasks
        })

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
