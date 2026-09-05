import Charts from "./Charts";
export default function Kundli({ charts, planetsData, VimMahaDasha }) {
  return (
    <div className="space-y-10 p-1 md:p-6 bg-white rounded-2xl shadow-md w-full">
      <Charts
        charts={charts}
        filterKeys={["Lagna", "Navamsa"]}
        gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
      />

      <h2 className="text-2xl font-bold text-center mb-4">Planets Data</h2>
      {/* <div className="relative overflow-x-auto shadow-md sm:rounded-lg"> */}
      <div className="w-[100] sm:w-full inline-block  align-middle shadow-md sm:rounded-lg">
        <div className="w-full overflow-x-auto">
          <div className="md:w-[0vw] lg:w-full w-screen">
            <table className="lg:w-[77vw] w-[100vw] text-sm"></table>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#7e60bf]">
                <tr>
                  {["Name", "Sign", "Degree", "House", "Nakshatra", "Retro"].map((title) => (
                    <th
                      key={title}
                      className="px-4 py-3 text-left text-xs font-semibold text-white tracking-wider whitespace-nowrap"
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs">
                {(Array.isArray(planetsData) ? planetsData : []).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 whitespace-nowrap">{p.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{p.sign}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{p.normDegree.toFixed(2)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{p.house}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{p.nakshatra}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{p.isRetro ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-6">Vimshottari Maha Dasha</h2>
       <div className=" lg:w-[55rem] sm:w-full inline-block  align-middle shadow-md sm:rounded-lg">
        <div className="w-full overflow-x-auto">
          <div className="md:w-[0vw] lg:w-full w-screen">
            <table className=" min-w-full divide-y divide-gray-200">
              <thead className="bg-[#7e60bf]">
                <tr>
                  {["Planet", "Start", "End"].map((title) => (
                    <th
                      key={title}
                      className="px-4 py-3 text-left text-xs font-semibold text-white tracking-wider whitespace-nowrap"
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(VimMahaDasha || []).length > 0 ? (
                  VimMahaDasha.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap">{d.planet}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{d.start}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{d.end}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-sm text-center text-gray-500 whitespace-nowrap"
                    >
                      No Dasha Data Available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      </div>
      );
}
