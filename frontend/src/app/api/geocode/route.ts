import { NextRequest, NextResponse } from "next/server"

/**
 * Forward geocoding API route.
 * Resolves city, river, lake, or full address queries to coordinates
 * using OpenStreetMap Nominatim with progressive fallback.
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

  const rawQuery = q.trim()

  // Generate candidate search queries from specific to broad
  const candidateQueries: string[] = [rawQuery]

  // If query contains commas (e.g. "River X, City, Country"), add progressive sub-queries
  if (rawQuery.includes(",")) {
    const parts = rawQuery.split(",").map((p) => p.trim()).filter(Boolean)
    if (parts.length >= 2) {
      // e.g. "City, Country"
      candidateQueries.push(parts.slice(1).join(", "))
      // e.g. "City"
      candidateQueries.push(parts[1])
    }
    // Also try without waterbody prefix like "River", "Ribeira", "Canal"
    const cleanedFirst = parts[0]
      .replace(/^(river|stream|lake|canal|fiume|ribeira|rio|lac)\s+/i, "")
      .trim()
    if (cleanedFirst && parts.length >= 2) {
      candidateQueries.push(`${cleanedFirst}, ${parts.slice(1).join(", ")}`)
    }
  }

  try {
    for (const query of candidateQueries) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query,
        )}&format=json&limit=1`,
        {
          headers: {
            "User-Agent": "StreamSense/0.1 (citizen-science-platform)",
            Accept: "application/json",
          },
        },
      )

      if (!res.ok) continue

      const data = await res.json()
      if (data && data.length > 0) {
        const item = data[0]
        return NextResponse.json({
          name: rawQuery,
          display_name: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        })
      }
    }

    return NextResponse.json(
      { error: `Location "${rawQuery}" not found. Try entering city or region name.` },
      { status: 404 },
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to resolve location" },
      { status: 500 },
    )
  }
}
