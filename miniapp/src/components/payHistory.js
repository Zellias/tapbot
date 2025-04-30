"use client";

import { useState } from 'react';
import moment from 'jalali-moment';

const PayHistory = ({ payments }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return 'text-yellow-400';
      case 'accepted':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending':
        return 'در انتظار';
      case 'accepted':
        return 'پذیرفته شده';
      case 'rejected':
        return 'رد شده';
      default:
        return status;
    }
  };

  const formatDate = (date) => {
    return moment(date).locale('fa').format('YYYY/MM/DD');
  };

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <h2 className="text-xl font-medium text-white">تاریخچه تراکنش‌ها</h2>
      
      <div className="flex flex-col gap-2">
        {payments?.map(payment => (
          <div 
            key={payment.id}
            className="flex items-center justify-between p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <div className="flex flex-col gap-1">
              <span className="text-white">{payment.amount.toLocaleString()} امتیاز</span>
              <span className="text-sm text-zinc-400">{formatDate(payment.createdAt)}</span>
            </div>
            
            <span className={`${getStatusColor(payment.status)}`}>
              {getStatusText(payment.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PayHistory;
