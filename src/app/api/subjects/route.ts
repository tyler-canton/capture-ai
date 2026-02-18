import { NextRequest, NextResponse } from "next/server";
import { getDataService } from "@/lib/DataService";

export async function GET(request: NextRequest) {
  try {
    const dataService = await getDataService();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search");
    const limit = searchParams.get("limit");
    const all = searchParams.get("all");

    if (all === "true") {
      return NextResponse.json(dataService.getAllSubjects());
    }

    if (search) {
      const results = dataService.searchByName(search, {
        limit: limit ? parseInt(limit, 10) : 10,
      });
      return NextResponse.json(results);
    }

    return NextResponse.json(dataService.getAllSubjects());
  } catch (error) {
    console.error("Error in subjects API:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
