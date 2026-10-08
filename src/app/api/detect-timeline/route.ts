import { NextRequest, NextResponse } from "next/server";
import { detectTimeline } from "@/lib/counterfactualGenerator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body?.query;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID INPUT: 'query' must be a non-empty string.",
        },
        { status: 400 }
      );
    }

    const result = await detectTimeline(query);

    if (result.isAmbiguous) {
      return NextResponse.json(result, { status: 200 });
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      {
        success: false,
        error: `TEMPORAL ANOMALY DETECTED: ${message}`,
      },
      { status: 500 }
    );
  }
}
