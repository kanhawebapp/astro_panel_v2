
import React from 'react';

function colorizeKundliSvg(svg) {
  const colorMap = {
    Su: "#ff6f00", Mo: "#800080", Ma: "#ff00fe", Me: "#0000ff",
    Ve: "#034804", Sa: "#a52a2a", Ju: "#aa00ff", Ra: "#f44336",
    Ke: "#008000", Ur: "#ff1f1f",
    1: "#ff0000", 2: "#827717", 3: "#0000ff", 4: "#c51162", 5: "#ff00ff", 6: "#f57c00", 7: "#800000", 8: "#008000", 9: "#000080", 10: "#ffa500", 11: "#a52a2a",
    12: "#800080",
  };

  return svg.replace(
    /<text([^>]*)>([^<]+)<\/text>/g,
    (match, attrs, inner) => {
      const key = inner.split(/[\s\-]/)[0];
      const fill = colorMap[key] || "#000000";

      attrs = attrs
        .replace(/style="[^"]*"/gi, '')
        .replace(/fill="[^"]*"/gi, '');

      return `<text${attrs} fill="${fill}" style="fill:${fill}">${inner}</text>`;
    }
  );
}

function beautifyKundliSvg(svg) {
  svg = colorizeKundliSvg(svg);

  svg = svg.replace(
    /<svg([^>]*)>/,
    `<svg$1 style="background-color:#f1ebffb3; border-radius: 12px; padding: 9px;">`
  );

  svg = svg.replace(/stroke="black"/gi, `stroke="#FFD700" `);

  svg = svg.replace(/<text([^>]*)>/g, `<text$1 font-size="16" font-weight="600" fill="#333" dx="-4">`);

  
  svg = svg.replace(/<svg([^>]*)width="([^"]+)"([^>]*)height="([^"]+)"([^>]*)>/,
    `<svg$1 viewBox="0 0 350 350"$3$5>`
  );

  return svg;
}

function Charts({ charts, filterKeys = [], gridClassName = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" }) {
  const chartList = [
    ["Lagna", "Lagna Chart"], ["Navamsa", "Navamsa Chart"], ["Chalit", "Chalit Chart"],
    ["Hora", "Hora Chart"], ["Drekkana", "Drekkana Chart"], ["Chaturthamsa", "Chaturthamsa Chart"],
    ["Saptamsa", "Saptamsa Chart"], ["Dasamsa", "Dasamsa Chart"], ["Dwadasamsa", "Dwadasamsa Chart"],
    ["Shodasamsa", "Shodasamsa Chart"], ["Vishamansha", "Vishamansha Chart"],
    ["Chaturvimsamsa", "Chaturvimsamsa Chart"], ["Trimsamsa", "Trimsamsa Chart"],
    ["Khavedamsa", "Khavedamsa Chart"], ["Akshavedamsa", "Akshavedamsa Chart"], ["Shastiamsa", "Shastiamsa Chart"]
  ];
  const filteredChartList = filterKeys.length > 0
    ? chartList.filter(([key]) => filterKeys.includes(key))
    : chartList;

  return (
    <section className="py-8 gap-4 bg-white rounded-lg shadow p-4">
      <h2 className="text-2xl font-semibold mb-4 text-center">Divisional Charts</h2>
      <div className={`grid ${gridClassName} gap-4 bg-white rounded-lg shadow p-4`}>
        {filteredChartList.map(([key, label]) => {
          let svg = charts[key]?.svg || charts[key];
          if (svg) svg = beautifyKundliSvg(svg);

          return (
            <div key={key} className="flex flex-col items-center rounded-lg hover:shadow-lg transition-all">
              <h3 className="text-lg font-semibold text-center mb-2">{label}</h3>
              {svg ? (
                <div className="w-full h-auto"> 
                  <div className="aspect-w-1 aspect-h-1"> 
                    <div dangerouslySetInnerHTML={{ __html: svg }} />
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500">Not available</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Charts;

