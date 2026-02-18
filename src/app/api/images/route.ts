import { NextRequest, NextResponse } from "next/server";
import { getDataService } from "@/lib/DataService";

export async function GET(request: NextRequest) {
  try {
    const dataService = await getDataService();
    const { searchParams } = new URL(request.url);

    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { error: "Missing 'ids' query parameter" },
        { status: 400 }
      );
    }

    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "No valid IDs provided" },
        { status: 400 }
      );
    }

    const images = dataService.getImagesBySubjectIDs(ids);
    return NextResponse.json(images);
  } catch (error) {
    console.error("Error in images API:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
