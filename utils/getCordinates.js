export async function getCoordinates(location) {
  if (!location) return null;

  try {
    const res = await fetch("/api/cities");

    if (!res.ok) {
      throw new Error("Failed to load cities");
    }

    const cities = await res.json();

    const city = cities.find((c) =>
      location.toLowerCase().includes(c.name.toLowerCase())
    );

    if (!city) return null;

    return {
      lat: Number(city.latitude),
      lon: Number(city.longitude),
    };
  } catch (err) {
    console.error("Coordinate lookup failed:", err);
    return null;
  }
}