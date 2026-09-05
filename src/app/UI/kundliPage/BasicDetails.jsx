

export default function BasicDetails({ birthData = {}, avakhada = {}, user_name = "", postData = {}, signs = [] }) {

  const languageMap = {
    en: "English",
    hi: "Hindi",
    
  };

  
  const getFullLanguageName = (code) => languageMap[code] || code; 

  return (
    <section className="space-y-5 md:p-3 bg-[#ffffffad] rounded-2xl shadow-md">
     
      <div className="border-purple-300 rounded-lg border shadow px-1 md:px-4 py-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Birth Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6">
          <InfoItem label="Name" value={user_name ? user_name.charAt(0).toUpperCase() + user_name.slice(1) : ""} />
          <InfoItem
            label="Date of Birth"
            value={(() => {
              
              let day = birthData.day || (postData.dob ? postData.dob.split("-")[2] : "");
              let month = birthData.month || (postData.dob ? postData.dob.split("-")[1] : "");
              let year = birthData.year || (postData.dob ? postData.dob.split("-")[0] : "");
             
              day = day ? day.toString().padStart(2, "0") : "";
              month = month ? month.toString().padStart(2, "0") : "";
              year = year ? year.toString().padStart(4, "0") : "";
              return `${day}:${month}:${year}`;
            })()}
          />
          <InfoItem
            label="Time"
            value={`${birthData.hour || postData.hours || ""}:${birthData.minute || postData.minute || ""}:${birthData.seconds || "00"} `}
          />
          <InfoItem
            label="Lat/Lon"
            value={`${birthData.latitude?.toFixed(4) || postData.coordinates?.split(",")[0] || ""}, ${birthData.longitude?.toFixed(4) || postData.coordinates?.split(",")[1] || ""}`}
          />
          <InfoItem
            label="Timezone"
            value={`GMT${birthData.timezone || postData.timezone || "" > 0 ? "+" : ""}${birthData.timezone || postData.timezone || ""}`}
          />
          <InfoItem label="Ayanamsha" value={`${birthData.ayanamsha?.toFixed(2) || ""}`} />
          <InfoItem label="Sunrise" value={birthData.sunrise || ""} />
          <InfoItem label="Sunset" value={birthData.sunset || ""} />
        </div>
      </div>

      
      <div className="border-purple-300 rounded-lg border shadow px-1 md:px-4 py-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Avakhada Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6">
          {Object.entries(avakhada).map(([k, v]) => (
            <InfoItem key={k} className="flex flex-col" label={k.charAt(0).toUpperCase() + k.slice(1)} value={v?.toString?.() || ""} />
          ))}
        </div>
      </div>

   
      <div className="border-purple-300 rounded-lg border shadow px-1 md:px-3 py-3">
        <h2 className="text-2xl font-bold mb-4 text-center">Panchang Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6">
          <InfoItem label="Tithi" value={avakhada.Tithi || ""} />
          <InfoItem label="Karan" value={avakhada.Karan || ""} />
          <InfoItem label="Yog" value={avakhada.Yog || ""} />
          <InfoItem label="Nakshatra" value={avakhada.Naksahtra || ""} />
        </div>
      </div>

     
      <div className="border-purple-300 rounded-lg border shadow px-1 md:px-4 py-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Additional Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6">
          <InfoItem label="Location" value={postData.location || ""} />
          <InfoItem label="Gender" value={postData.gender || ""} />
          <InfoItem label="Chart Style" value={postData.chart_style || ""} />
          <InfoItem label="Language" value={getFullLanguageName(postData.language) || ""} />
        </div>
      </div>
    </section>
  );
}

function InfoItem({ label, value, className }) {
  return (
    <div className={`bg-[#7e60bf] p-2.5 md:p-4 rounded-xl shadow-sm flex flex-col lg:flex-row   items-start lg:items-center justify-between ${className || ""}`}>
      <div className="text-white text-xs md:text-base font-semibold">{label}</div>
      <div className="text-white text-xs md:text-sm font-semibold mt-1">{value}</div>
    </div>
  );
}