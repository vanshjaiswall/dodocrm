import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a CRM data extraction assistant for Dodo Payments. You will receive a meeting transcript or summary from a sales/demo call. Extract the following lead information from the transcript and return it as JSON.

Required JSON fields:
- businessName (string): The company or business name discussed
- email (string): Contact email if mentioned
- website (string): Company website if mentioned
- businessDetails (string): A concise 2-3 sentence summary of what the business does, their size, and relevant context
- category (string): Business category/industry (e.g., "SaaS", "E-commerce", "Marketplace", "Gaming", "Fintech", "Creator Economy")
- tier (string): Must be exactly "HIGH", "MEDIUM", or "LOW" — assess based on deal size, urgency, and fit
- painPoints (string): Key problems or challenges the business mentioned
- questionsAsked (string): Important questions the prospect asked during the meeting
- nextAction (string): Agreed next steps or follow-up actions

Rules:
- Return ONLY valid JSON, no markdown, no code fences, no explanation
- If a field cannot be determined from the transcript, use an empty string ""
- For tier: HIGH = large deal / urgent / great fit, MEDIUM = moderate, LOW = small / exploratory
- Keep businessDetails, painPoints, and questionsAsked concise but informative
- Extract actual data from the transcript — do not make up information`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured. Add it to your .env file." },
        { status: 501 }
      );
    }

    const body = await req.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a meeting transcript (at least 10 characters)." },
        { status: 400 }
      );
    }

    // Call Groq API (OpenAI-compatible)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Here is the meeting transcript/summary:\n\n${transcript.trim()}` },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Groq API error (${response.status})`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let extracted;
    try {
      // Clean the response in case it has markdown fences
      let jsonStr = content.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      extracted = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    // Validate tier value
    if (extracted.tier && !["HIGH", "MEDIUM", "LOW"].includes(extracted.tier)) {
      extracted.tier = "MEDIUM";
    }

    // Return only the expected fields
    return NextResponse.json({
      businessName: extracted.businessName || "",
      email: extracted.email || "",
      website: extracted.website || "",
      businessDetails: extracted.businessDetails || "",
      category: extracted.category || "",
      tier: extracted.tier || "MEDIUM",
      painPoints: extracted.painPoints || "",
      questionsAsked: extracted.questionsAsked || "",
      nextAction: extracted.nextAction || "",
    });
  } catch (error: any) {
    console.error("AI parse error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
