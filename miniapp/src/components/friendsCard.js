const FriendsCard = ({ avatar, name, score }) => {
    return (
        <div className="flex flex-row-reverse items-center gap-4 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
                <img 
                    src={avatar}
                    alt={`${name}'s avatar`}
           
                    className="object-cover"
                />
            </div>
            <div className="flex-1 text-right">
                <h3 className="text-lg font-medium text-white">{name}</h3>
                <p className="text-sm text-zinc-400">امتیاز: {score}</p>
            </div>
        </div>
    );
};

export default FriendsCard;
