"use client";

import { useState } from 'react';
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';

const WithdrawModal = ({ isOpen, onClose, theme, processWithdraw }) => {
    const [cardNumber, setCardNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [card, setCard] = useState({
        number: '',
        expiry: '',
        cvc: '',
        name: '',
        focus: ''
    });

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'number') {
            const cleaned = value.replace(/[^\d]/g, '');
            if (cleaned.length <= 16) {
                setCard(prev => ({ ...prev, [name]: cleaned }));
                setCardNumber(cleaned);
            }
        } else if (name === 'amount') {
            const cleaned = value.replace(/[^\d]/g, '');
            setAmount(cleaned);
        } else {
            setCard(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleInputFocus = (e) => {
        setCard(prev => ({ ...prev, focus: e.target.name }));
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-100">
            <div style={{
                backgroundColor: theme?.secondary_bg_color || '#151617',
                borderColor: theme?.section_separator_color || '#232426'
            }} className="p-6 rounded-lg border shadow-xl backdrop-blur-md">
                <Cards
                    number={card.number}
                    name={card.name}
                    expiry={card.expiry}
                    cvc={card.cvc}
                    focused={card.focus}
                />
                <h2 style={{ color: theme?.text_color || '#DFE1E5' }} className="text-xl mb-4 text-center mt-3">اطلاعات کارت را وارد کنید</h2>
                <div className="space-y-4 flex flex-col items-center">
                    <input
                        type="text"
                        name="number"
                        value={card.number}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        style={{
                            backgroundColor: theme?.section_bg_color || '#1A1B1C',
                            borderColor: theme?.section_separator_color || '#232426',
                            color: theme?.text_color || '#DFE1E5'
                        }}
                        className="border p-2 w-64 text-center rounded-md placeholder-zinc-500 focus:outline-none focus:ring-2"
                        placeholder="شماره کارت"
                        maxLength={16}
                    />
                    <input
                        type="text"
                        name="name"
                        value={card.name}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        style={{
                            backgroundColor: theme?.section_bg_color || '#1A1B1C',
                            borderColor: theme?.section_separator_color || '#232426',
                            color: theme?.text_color || '#DFE1E5'
                        }}
                        className="border p-2 w-64 text-center rounded-md placeholder-zinc-500 focus:outline-none focus:ring-2"
                        placeholder="نام دارنده کارت"
                    />
                    <input
                        type="text"
                        name="amount"
                        value={amount}
                        onChange={handleInputChange}
                        style={{
                            backgroundColor: theme?.section_bg_color || '#1A1B1C',
                            borderColor: theme?.section_separator_color || '#232426',
                            color: theme?.text_color || '#DFE1E5'
                        }}
                        className="border p-2 w-64 text-center rounded-md placeholder-zinc-500 focus:outline-none focus:ring-2"
                        placeholder="امتیاز"
                    />
                </div>
                <div className="flex justify-center gap-2 mt-4">
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: theme?.section_bg_color || '#1A1B1C',
                            color: theme?.text_color || '#DFE1E5'
                        }}
                        className="px-4 py-2 rounded hover:opacity-90 transition-colors"
                    >
                        بستن
                    </button>
                    <button
                        onClick={() => processWithdraw(card.number, amount)}
                        style={{
                            backgroundColor: theme?.button_color || '#00AB80',
                            color: theme?.button_text_color || '#FFFFFF'
                        }}
                        className="px-4 py-2 rounded hover:opacity-90 transition-colors"
                    >
                        تایید
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WithdrawModal;
