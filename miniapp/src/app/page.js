"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/nav";
import ScoreText from "@/components/scoreText";
import useUser from "@/hooks/useUser";
import WithdrawModal from "@/components/withdrawModa";
import { Heart, CheckSquare, Award } from "react-feather";
import Slider from "@/components/slider";
import PayHistory from "@/components/payHistory";
import useSdk from "@/hooks/useSdk";
import { Toaster, toast } from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [user, theme] = useUser();
  const sdk = useSdk();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sdk) {
      if(sdk.isIframe){
        router.push("/mobile")
      }
    }
  }, [sdk]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Try to get cached data first
      const cachedData = localStorage.getItem('userData');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setUserData(parsedData);
        setLoading(false);
      }

      // Fetch fresh data from API
      const response = await fetch('/api/user', {
        headers: {
          'X-USER-ID': user?.id
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();

      // Update state and cache
      setUserData(data);
      localStorage.setItem('userData', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user]);

  const slides = [
    {
      icon: <Heart size={20} className="text-white" />,
      title: "دعوت دوستان",
      description: "با دعوت هر دوست در بخش دوستان 500 امتیاز بدست آورید"
    },
    {
      icon: <CheckSquare size={20} className="text-white" />,
      title: "انجام تسک‌ها",
      description: "با انجام دادن تسک های جدید امتیاز خود را اضافه کنید"
    },
    {
      icon: <Award size={20} className="text-white" />,
      title: "لیدربرد", 
      description: "با بالارفتن در بخش لیدربرد شانس خود را برای دریافت جوایز بزرگ امتحان کنید"
    }
  ];

  const processWithdraw = async (cardNumber, amount) => {
    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-USER-ID': user?.id
        },
        body: JSON.stringify({ cardNumber, amount })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast.success(data.message);
      setShowModal(false);
      await fetchUserData(); // Refresh user data to show updated score
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 p-4">
        <div className="flex flex-col gap-4 mb-24">
          <div className="min-h-screen bg-zinc-900 p-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        </div>
        <Nav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-4">
      <Toaster position="bottom-center" />
      <div className="flex flex-col gap-4 mb-24">
        <ScoreText value={userData?.user?.score || 0} />
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-md block mt-4 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors text-white"
          >
            برداشت
          </button>
          <button 
            className="px-4 py-2 rounded-md block mt-4 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors text-white"
            onClick={() => router.push("/spin")}
          >
            گردونه
          </button>
        </div>

        <WithdrawModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          theme={theme}
          processWithdraw={processWithdraw}
        />
        <Slider slides={slides} autoplayInterval={5000} />
        <PayHistory payments={userData?.user?.Payment || []} />
      </div>
      <Nav />
    </div>
  );
}
