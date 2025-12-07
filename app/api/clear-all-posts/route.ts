import { NextRequest, NextResponse } from "next/server";
import { clearAllPosts } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await clearAllPosts();
    return NextResponse.json({ success: true, message: "All posts cleared successfully" });
  } catch (error) {
    console.error("Failed to clear all posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear all posts" },
      { status: 500 }
    );
  }
}

