"use client";

const ScoreText = ({ value }) => {
    return (
        <div className="w-full flex justify-center">
            <div className="flex flex-col items-center">
                <span className="text-zinc-400 text-lg mt-2">امتیاز شما</span>
                <span className="font-mono font-bold text-5xl text-white">
                    {value}
                </span>
            </div>
        </div>
    );
};

export default ScoreText;
