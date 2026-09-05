"use client";

import { useState, useMemo, useEffect } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import metadata from "libphonenumber-js/metadata.min.json";
import ReactCountryFlag from "react-country-flag";

function getCountries() {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    const countryCodes = Object.keys(metadata.countries);

    return countryCodes.map((iso) => {
        const dialCode = `+${metadata.countries[iso][0]}`;
        return {
            iso,
            name: displayNames.of(iso),
            dialCode,
        };
    });
}

export default function PhoneInput({ onChange, handleKeyEnter }) {
    const countries = useMemo(() => getCountries(), []);

    const defaultCountry =
        countries.find((c) => c.iso === "IN") || countries[0];

    const [country, setCountry] = useState(defaultCountry);

    const [number, setNumber] = useState("");

    useEffect(() => {
        const phone = parsePhoneNumberFromString(
            `${country.dialCode}${number}`
        );
        console.log("Parsed phonexxxxxxxxxxxxxxxxxx:", phone);

        onChange({
            raw: number,
            dialCode: country.dialCode,
            iso: country.iso,
            e164: phone?.number || "",
            isValid: phone?.isValid() || false,
        });
    }, [number, country, onChange]);

    return (
        <div className="flex  gap-0.5 rounded">
            <div className="flex w-30 items-center gap-0.5 h-full  px-3 py-3 border border-gray-500 text-white rounded-lg shadow-lg">
                <ReactCountryFlag
                    countryCode={country.iso.toUpperCase()}
                    svg
                    style={{
                        width: "1.1em",
                        height: "1.1em",
                    }}
                />

                <select
                    value={country.iso}
                    onChange={(e) =>
                        setCountry(countries.find((c) => c.iso === e.target.value))
                    }
                    className=" text-white outline-none text-sm w-full"
                >
                    {countries.map((c) => (
                        <option className="text-black" key={c.iso} value={c.iso}>
                            ({c.dialCode})  {c.name}
                        </option>
                    ))}
                </select>
            </div>

            <input
                type="tel"
                className="flex-1 px-3 py-2 border !mb-0 text-white border-gray-500 !rounded-lg placeholder:text-xs shadow-lg outline-none"
                placeholder="Mobile number"
                value={number}
                onKeyDown={handleKeyEnter}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 15) setNumber(val);
                }}


            />
        </div>
    );
}
