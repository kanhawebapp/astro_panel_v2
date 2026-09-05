// app/api/cities/route.js

import { Country, State, City } from "country-state-city";

export async function GET() {
  const india = Country.getAllCountries().find(
    (country) => country.isoCode === "IN"
  );

  if (!india) {
    return Response.json(
      { error: "India not found" },
      { status: 404 }
    );
  }

  const states = State.getStatesOfCountry(india.isoCode);

  const cities = states.flatMap((state) =>
    City.getCitiesOfState(india.isoCode, state.isoCode)
  );

  return Response.json(cities);
}