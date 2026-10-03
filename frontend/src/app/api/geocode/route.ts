import { NextRequest, NextResponse } from "next/server"

/**
 * Forward geocoding API route.
 * Resolves city or place names to coordinates using OpenStreetMap Nominatim.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get("q")

  if (!q || !q.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    )
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        q.trim(),
      )}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "StreamSense/0.1 (citizen-science-platform)",
          Accept: "application/json",
        },
      },
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 502 },
      )
    }

    const data = await res.json()
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "City or place not found. Please try another name." },
        { status: 404 },
      )
    }

    const item = data[0]
    return NextResponse.json({
      name: item.name || q.trim(),
      display_name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to resolve location" },
      { status: 500 },
    )
  }
}
