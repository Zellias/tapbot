"use client";
import { useState, useEffect } from 'react';
import Nav from "@/components/nav";
import useSdk from "@/hooks/useSdk";
import useUser from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import toast, { Toaster } from 'react-hot-toast';
import ScoreText from "@/components/scoreText";

export default function Spin() {
  const router = useRouter();
  const [user] = useUser();
  const sdk = useSdk();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBox, setSelectedBox] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [prize, setPrize] = useState(null);

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
      const cachedData = localStorage.getItem('userData');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setUserData(parsedData);
        setLoading(false);
      }

      const response = await fetch('/api/user', {
        headers: {
          'X-USER-ID': user?.id
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();

      setUserData(data);
      localStorage.setItem('userData', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user]);

  const handleBoxClick = async (boxNumber) => {
    try {
      setSelectedBox(boxNumber);
      
      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-USER-ID': user?.id
        },
        body: JSON.stringify({ boxNumber })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setPrize(data.prize);
      setShowModal(true);
      await fetchUserData(); // Refresh user data to show updated score
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 p-4">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
        <Nav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-4" >
      <Toaster position="bottom-center" />
      <div className="flex flex-col gap-8 mb-24">
        <ScoreText value={userData?.user?.score || 0} />
        
        <div className="text-center text-white mb-4">
          <h2 className="text-2xl font-bold mb-2">جعبه شانس</h2>
          <p className="text-gray-300" dir="rtl">یکی از جعبه ها را انتخاب کنید و شانس خود را امتحان کنید!</p>
          <p className="text-sm text-gray-400 mt-2" dir="rtl">هر انتخاب 1000 امتیاز هزینه دارد</p>
        </div>

        <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto px-4">
          {[1, 2, 3, 4, 5, 6].map((boxNumber) => (
            <button
              key={boxNumber}
              onClick={() => handleBoxClick(boxNumber)}
              className="aspect-square rounded-xl bg-white/5 backdrop-blur-sm border-2 border-white/20 hover:bg-white/10 hover:border-white/30 transition-all flex items-center justify-center text-white text-4xl font-bold shadow-lg hover:shadow-xl hover:scale-105"
            >
              {boxNumber}
            </button>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-zinc-800 p-8 rounded-xl max-w-sm w-full border border-white/10">
            <h3 className="text-2xl text-white mb-4 text-center font-bold">🎉 تبریک! 🎉</h3>
            <p className="text-white text-center text-xl mb-6">{prize === 0 ? 'پوچ!' : `${prize} امتیاز برنده شدید!`}</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full px-6 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all text-white font-medium"
            >
              بستن
            </button>
          </div>
        </div>
      )}
      
      <Nav />
    </div>
  );
}
