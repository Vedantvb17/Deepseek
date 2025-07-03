export const maxDuration = 60;

import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    console.log("✅ /api/chat/ai endpoint hit");

    const { userId } = getAuth(req);
    const { chatId, prompt } = await req.json();

    console.log("🔑 userId:", userId);
    console.log("🧠 Received prompt:", prompt);

    if (!userId) {
      console.log("❌ No user ID");
      return NextResponse.json({ success: false, message: "User not authenticated" });
    }

    await connectDB();
    const chat = await Chat.findOne({ userId, _id: chatId });

    if (!chat) {
      console.log("❌ Chat not found");
      return NextResponse.json({ success: false, message: "Chat not found" });
    }

    // Save user message
    const userMessage = {
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };
    chat.messages.push(userMessage);

    // ✅ Call OpenRouter API
    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct", // Free, change to Claude/GPT if needed
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: prompt }
        ]
      }),
    });

    const responseData = await openRouterRes.json();

    const aiResponse = responseData.choices?.[0]?.message?.content;
    if (!aiResponse) {
      console.log("❌ No AI response from OpenRouter");
      return NextResponse.json({ success: false, message: "No response from AI" });
    }

    console.log("💬 OpenRouter response:", aiResponse);

    const assistantMessage = {
      role: "assistant",
      content: aiResponse,
      timestamp: Date.now(),
    };

    chat.messages.push(assistantMessage);
    await chat.save();

    return NextResponse.json({ success: true, data: assistantMessage });

  } catch (error) {
    console.error("❌ OpenRouter API Error:", error);
    return NextResponse.json({
      success: false,
      message: "OpenRouter request failed",
      error: error.message,
    });
  }
}
