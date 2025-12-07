import { NextRequest, NextResponse } from "next/server";
import { generateWithGrok } from "@/lib/grok";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, prompt } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 }
      );
    }

    if (!prompt) {
      // If no prompt, return all items
      return NextResponse.json({ filtered: items });
    }

    console.log(`🔍 [FILTER] Filtering ${items.length} items with prompt: ${prompt}`);

    const systemPrompt = `You are a data filtering assistant. Your job is to filter a list of items based on user criteria.
Return ONLY a JSON array of items that match the criteria. Do not add any explanation.`;

    const filterPrompt = `Filter these items based on the following criteria: "${prompt}"

Items to filter:
${items.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Return a JSON array containing ONLY the items that match the criteria. Example format:
["matching item 1", "matching item 2"]

If no items match, return an empty array: []`;

    try {
      const response = await generateWithGrok(systemPrompt, filterPrompt, 0.3);
      
      // Parse the JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log("🔍 [FILTER] No JSON array found, returning original items");
        return NextResponse.json({ filtered: items });
      }
      
      const filtered = JSON.parse(jsonMatch[0]);
      
      console.log(`🔍 [FILTER] Filtered ${items.length} items down to ${filtered.length}`);

      return NextResponse.json({
        filtered,
        original_count: items.length,
        filtered_count: filtered.length,
      });
    } catch (parseError) {
      console.error("Failed to parse filter response:", parseError);
      return NextResponse.json({ filtered: items });
    }
  } catch (error) {
    console.error("Error filtering data:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to filter data",
      },
      { status: 500 }
    );
  }
}

