"use client";

import { useState, useMemo } from "react";
import ReactCountryFlag from "react-country-flag";
import { getCountries } from "../../../utils/getCountries";

export default function CountryDropdown({ selected, onSelect }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const countries = useMemo(() => getCountries(), []);

  const filtered = countries.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search)
  );

  return (
    <div className="relative w-60">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border p-2 w-full"
      >
        <ReactCountryFlag countryCode={selected.iso} svg />
        {selected.dialCode}
      </button>

      {open && (
        <div className="absolute bg-white border mt-1 w-full max-h-60 overflow-y-auto z-20">
          <input
            type="text"
            placeholder="Search..."
            className="w-full p-2 border-b"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filtered.map((country) => (
            <div
              key={country.iso}
              onClick={() => {
                onSelect(country);
                setOpen(false);
              }}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
            >
              <ReactCountryFlag countryCode={country.iso} svg />
              {country.name} ({country.dialCode})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
