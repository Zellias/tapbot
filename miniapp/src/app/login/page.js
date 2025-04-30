"use client"
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const LoginPage = () => {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [step, setStep] = useState('request'); // 'request' or 'verify'
    const [captchaToken, setCaptchaToken] = useState('');
    const inputRef = useRef(null);
    const captchaRef = useRef(null);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleChange = (value) => {
        // Only allow numbers and limit to 6 digits
        const numbersOnly = value.replace(/[^\d]/g, '').slice(0, 6);
        setOtpValue(numbersOnly);

        // Auto-submit when all 6 digits are entered
        if (numbersOnly.length === 6) {
            handleVerifyOtp(new Event('submit'));
        }
    };

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        if (loading || !captchaToken) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/request-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    captchaToken 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep('verify');
                setCountdown(30);
            } else {
                if (data.type && data.code) {
                    setError(data.message);
                } else {
                    setError('خطا در ارسال کد');
                }
                captchaRef.current?.resetCaptcha();
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
            captchaRef.current?.resetCaptcha();
        } finally {
            setLoading(false);
            setCaptchaToken('');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (loading) return;
        
        // Check if all 6 digits are entered
        if (otpValue.length !== 6) {
            setError('لطفا کد 6 رقمی را کامل وارد کنید');
            return;
        }
        
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ otp: otpValue }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                router.push('/dash');
            } else {
                if (data.type && data.code) {
                    setError(data.message);
                } else {
                    setError('کد وارد شده صحیح نمی‌باشد.');
                }
                setOtpValue('');
                inputRef.current?.focus();
                setCountdown(30); // Start countdown for retry
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = () => {
        captchaRef.current?.execute();
        setStep('request');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-800 to-zinc-900 flex items-center justify-center p-4">
            <div className="bg-zinc-800/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-700/50">
                <h1 className="text-3xl font-bold text-white mb-8 text-center">ورود به سیستم</h1>
                
                {step === 'request' ? (
                    <form onSubmit={handleRequestOtp} className="space-y-6">
                        <HCaptcha
                            ref={captchaRef}
                            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
                            onVerify={(token) => setCaptchaToken(token)}
                            onExpire={() => setCaptchaToken('')}
                        />

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                                <p className="text-red-400 text-center">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !captchaToken}
                            className={`w-full bg-blue-600 text-white py-3 rounded-xl text-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 ${
                                (loading || !captchaToken) ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-[1.02]'
                            }`}
                        >
                            {loading ? 'در حال ارسال...' : 'ارسال کد'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div>
                            <label className="block text-zinc-300 text-lg mb-3 text-center" htmlFor="otp">
                                کد ۶ رقمی تایید را وارد کنید
                            </label>
                            <input
                                ref={inputRef}
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                className="w-full text-center text-2xl rounded-xl bg-zinc-700/50 text-white border-2 border-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 py-3"
                                value={otpValue}
                                onChange={(e) => handleChange(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                                <p className="text-red-400 text-center">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-blue-600 text-white py-3 rounded-xl text-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 ${
                                loading ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-[1.02]'
                            }`}
                        >
                            {loading ? 'در حال بررسی...' : 'ورود'}
                        </button>

                        {countdown > 0 ? (
                            <p className="text-zinc-400 text-center">
                                ارسال مجدد کد تا {countdown} ثانیه دیگر
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendCode}
                                className="w-full text-zinc-400 hover:text-white transition-colors"
                            >
                                ارسال مجدد کد
                            </button>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
