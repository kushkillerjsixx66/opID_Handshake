import { NextRequest, NextResponse } from "next/server";
import { runOpIdHandshake } from "@/domain/opid/handshake";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.candidate_opid || !body?.transmission_context) {
      return NextResponse.json(
        {
          error: "INVALID_REQUEST",
          message:
            "candidate_opid and transmission_context (origin, channel) are required."
        },
        { status: 400 }
      );
    }

    const handshake = runOpIdHandshake(body);
    const status =
      handshake.completion?.status === "HANDSHAKE_FAILED" ? 422 : 200;

    return NextResponse.json(handshake, { status });
  } catch (err) {
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Unexpected error during opID handshake."
      },
      { status: 500 }
    );
  }
}
