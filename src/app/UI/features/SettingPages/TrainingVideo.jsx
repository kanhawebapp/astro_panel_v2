
const VideoCard = ({ title, videoId, description, timestamp, watched }) => {
  return (
    <div className="bg-white shadow-lg rounded-xl p-4 md:w-80">
    
      <div className="relative w-full h-44">
        <iframe
          className="w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>

      <h3 className="mt-3 text-sm font-medium pb-1">{title}</h3>

      <p className="text-gray-600 text-sm">{description}</p>

      <div className="flex justify-between items-center mt-2 text-sm">
        <span className="text-blue-500">{timestamp}</span>
        <span className={watched ? "text-green-500" : "text-red-500"}>
          {watched ? "Watched" : "Watch"}
        </span>
      </div>
    </div>
  );
};

export default VideoCard;
