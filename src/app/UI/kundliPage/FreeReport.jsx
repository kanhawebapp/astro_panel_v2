import { useState } from "react";

export default function FreeReportSection({
  basicData,
  BasicReport,
  KalsarpaData,
  ManglikData,
  planetaryReport,
  AscendantData2,
}) {
  const [selectedReport, setSelectedReport] = useState("basic");

  const buttonClasses = (active) =>
    `px-4 py-2 rounded-full font-semibold transition ${
      active
        ? "bg-[#7e60bf] text-white shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <section className="p-2 md:p-6 bg-white rounded-2xl shadow-md space-y-6">
      {/* Tab Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          className={buttonClasses(selectedReport === "basic")}
          onClick={() => setSelectedReport("basic")}
        >
          Basic
        </button>
        <button
          className={buttonClasses(selectedReport === "planetary")}
          onClick={() => setSelectedReport("planetary")}
        >
          Planetary Report
        </button>
        <button
          className={buttonClasses(selectedReport === "dosha")}
          onClick={() => setSelectedReport("dosha")}
        >
          Dosha
        </button>
      </div>

      {/* Report Content */}
      <div className="mt-4 p-2 md:p-6 bg-gray-50 rounded-xl shadow-inner space-y-6">
        {selectedReport === "basic" && (
          <>
            <section>
              <h2 className="text-xl md:text-2xl font-bold mb-3 text-center text-[#7e60bf">Ascendant Report</h2>
              <div className="p-4 bg-whitep-4 border-l-4 border-[#7e60bf] bg-[#deceff78] rounded-lg space-y-2">
                <h3 className="text-lg font-medium mb-2">Ascendant: {basicData || "N/A"}</h3>
                <p className="text-sm md:text-md">{BasicReport || "No report available."}</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold mt-6 mb-3 text-center text-[#7e60bf]">Ascendant Details</h2>
              <div className="space-y-4">
                {Object.entries(AscendantData2 || {}).map(([section, arr]) => (
                  <div key={section} className="p-4 border-l-4 border-[#e74c3c] bg-[#ffe6e6] rounded-lg space-y-2">
                    <h3 className="text-lg font-semibold">
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                    </h3>
                    <ul className="text-sm">
                      {arr.map((txt, i) => (
                        <li key={i}>{txt || "No details available."}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {selectedReport === "planetary" && (
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-center text-[#7e60bf]">Planetary House Reports</h2>
            <div className="space-y-6">
              {planetaryReport && planetaryReport.length > 0 ? (
                planetaryReport.map((report, i) => (
                  <div key={i} className="p-4 border-l-4 border-[#7e60bf] bg-[#deceff78] rounded-lg">
                    <h3 className="text-lg font-medium">{`${report.planet} Consideration`}</h3>
                    <p className="text-gray-700">{report.house_report || "No report available."}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-700 text-center">No planetary reports available.</p>
              )}
            </div>
          </section>
        )}

        {selectedReport === "dosha" && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-center text-[#7e60bf]">Dosha Information</h2>

            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-[#f39c12]">Kalsarpa Dosha</h3>
              <div className="p-4 border-l-4 border-[#f39c12] bg-[#fff3e6] rounded-lg">
                <p className="text-gray-700">{KalsarpaData?.one_line || "No Kalsarpa Dosha information available."}</p>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-[#e74c3c]">Manglik Dosha</h3>
              <div className="p-4 border-l-4 border-[#e74c3c] bg-[#ffe6e6] rounded-lg space-y-2">
                <p><strong>Status:</strong> {ManglikData?.manglik_status || "N/A"}</p>
                <p><strong>Present:</strong> {ManglikData?.is_present ? "Yes" : "No"}</p>
                <p><strong>Cancelled:</strong> {ManglikData?.is_mars_manglik_cancelled ? "Yes" : "No"}</p>

                {ManglikData?.manglik_present_rule && (
                  <>
                    <h4 className="text-md font-semibold mt-4 mb-2">Based on Aspect</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                      {ManglikData.manglik_present_rule.based_on_aspect.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>

                    <h4 className="text-md font-semibold mt-4 mb-2">Based on House</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                      {ManglikData.manglik_present_rule.based_on_house.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}