import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
   // const domain = process.env.METERED_DOMAIN;
   // const apiKey = process.env.METERED_API_KEY;
   const domain = "stagingdhwaniastro.metered.live";
    const apiKey = "70b93e8b2d77e31b3c01ad5647556a6fbe97";

    if (!domain || !apiKey) {
      console.error(
        "[TURN] Metered environment variables are missing"
      );

      return NextResponse.json(
        {
          success: false,
          message: "TURN configuration is missing",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("[TURN] Metered API error:", {
        status: response.status,
        response: errorText,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Unable to fetch TURN credentials",
        },
        { status: 502 }
      );
    }

    const iceServers = await response.json();

    if (
      !Array.isArray(iceServers) ||
      iceServers.length === 0
    ) {
      throw new Error(
        "Metered returned an invalid ICE server response"
      );
    }

    console.log(
      "[TURN] Metered ICE servers fetched successfully:",
      {
        count: iceServers.length,
      }
    );

    return NextResponse.json(
      {
        success: true,
        iceServers,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "[TURN] Error fetching credentials:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch TURN credentials",
      },
      { status: 500 }
    );
  }
}