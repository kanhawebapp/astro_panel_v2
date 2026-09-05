
import VideoCard from '@/app/UI/features/SettingPages/TrainingVideo'


export default function TrainingVideos() {
  return (
    <>
         <div className="wallet-head justify-self-center text-center">Training Videos</div>
    
  
    <div className="flex flex-wrap gap-6 p-6  ">
      <VideoCard
        title="3 Crystals Everyone Should Use"
        videoId="GdE30UNQXzU?si=kRi9YOBUUHrABsQe" 
        description="Wallet History, Astrologer Dashboard etc."
        timestamp="01-Jan-2000, 07:30 AM"
        watched={false}
      />
      <VideoCard
        title="Is Astrology Real?"
        videoId="Z1xtQkosANM?si=3hXIAr-I6yL3gBDL"
        description="Wallet History, Astrologer Dashboard etc."
        timestamp="01-Jan-2000, 07:30 AM"
        watched={true}
      />
    </div>
    </>
  );
}

