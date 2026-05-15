import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_API_KEY = Deno.env.get("chatbot");

if (!GROQ_API_KEY) {
  throw new Error("Missing GROQ_API_KEY in Supabase secrets");
}

interface QueryClassification {
  isQuick: boolean;
  isProteinQuery: boolean;
  isCalorieQuery: boolean;
  isCalculation: boolean;
  isMacroQuery: boolean;
}

function classifyQuery(message: string): QueryClassification {
  const lowerMsg = message.toLowerCase();

  const quickPatterns = [
    /berapa.*protein/i,
    /how much.*protein/i,
    /kebutuhan.*protein/i,
    /protein.*butuh/i,
    /hitung.*protein/i,
    /kalori.*butuh/i,
    /berapa.*kalori/i,
    /berapa.*carb/i,
    /berapa.*fat/i,
    /berapa.*lemak/i,
    /kebutuhan.*kalori/i,
    /kebutuhan.*carb/i,
    /kebutuhan.*lemak/i,
    /how much.*calor/i,
    /how much.*carb/i,
    /how much.*fat/i,
  ];

  const isQuick = quickPatterns.some(pattern => pattern.test(message));

  return {
    isQuick,
    isProteinQuery: /protein/i.test(message),
    isCalorieQuery: /kalori|calorie/i.test(message),
    isCalculation: /berapa|how much|hitung|kebutuhan/i.test(message),
    isMacroQuery: /protein|kalori|calorie|carb|karbohidrat|fat|lemak/i.test(message)
  };
}

function buildSystemPrompt(context: string, queryType: QueryClassification): string {
  let systemPrompt = `You are an expert Nutrition and Fitness Coach representing **Coach Mury Kuswari**.
Your goal is to provide evidence-based, personalized advice on nutrition, fitness, and healthy lifestyle.
Key guidelines:
- Be encouraging, professional, and empathetic.
- Use the provided context from the Knowledge Base and Athlete data to give specific recommendations.
- If the question is about medical conditions, always include a disclaimer to consult with a doctor.
- Focus on sustainable habits rather than quick fixes.
- Answer in the same language as the user (Indonesian if unsure).
- You are representing "Nutrition by Coach Mury Kuswari".\n\n` + context;

  if (queryType.isQuick && queryType.isCalculation) {
    systemPrompt += "\n\nIMPORTANT INSTRUCTIONS:\n";
    systemPrompt += "- Answer DIRECTLY and CONCISELY\n";
    systemPrompt += "- Start with the main number/answer in BOLD format\n";
    systemPrompt += "- Show calculation breakdown using bullet points (•)\n";
    systemPrompt += "- Include current status if data available\n";
    systemPrompt += "- Keep response under 100 words\n";
    systemPrompt += "- NO lengthy explanations or motivation\n";
    systemPrompt += "\nExample format:\n";
    systemPrompt += "**Protein: 140g/hari**\n\n";
    systemPrompt += "• Berat: 70kg × 2.0g = 140g\n";
    systemPrompt += "• Faktor: 2.0g/kg (muscle gain)\n";
    systemPrompt += "• Current intake: 95g ⚠️\n";
  } else {
    systemPrompt += "\n\nProvide personalized, evidence-based nutrition and fitness advice. ";
    systemPrompt += "Be concise but helpful. Use bullet points for clarity. ";
    systemPrompt += "Reference the athlete's data when relevant.";
  }

  return systemPrompt;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, athlete_id } = await req.json();

    // Authentication: reject if no valid bearer token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized: missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace(/^Bearer /i, "");
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        throw new Error("Invalid token");
      }
      // Optional: ensure the authenticated user owns the requested athlete or is admin
      if (athlete_id && user.id !== athlete_id) {
        // Optionally allow admin role check
        const { data: roleData, error: roleErr } = await supabase
          .from("athletes")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (!roleErr && roleData?.role !== "admin") {
          return new Response(JSON.stringify({ error: "Forbidden: cannot access other athletes" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } catch (authErr) {
      return new Response(JSON.stringify({ error: "Unauthorized: invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const queryType = classifyQuery(message);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: athlete } = await supabase
      .from("athletes")
      .select("*")
      .eq("id", athlete_id)
      .maybeSingle();

    const { data: recentMetrics } = await supabase
      .from("fitness_metrics")
      .select("*")
      .eq("athlete_id", athlete_id)
      .order("date", { ascending: false })
      .limit(5);

    const { data: recentNutrition } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("athlete_id", athlete_id)
      .order("date", { ascending: false })
      .limit(10);

    const keywords = message.toLowerCase().split(' ').filter((word: string) => word.length > 3);
    let relevantDocs = [];
    
    if (keywords.length > 0) {
      const { data: docs } = await supabase
        .from("knowledge_base")
        .select("*")
        .or(keywords.map((k: string) => `content.ilike.%${k}%`).join(','))
        .limit(3);
      relevantDocs = docs || [];
    }

    let context = queryType.isQuick
      ? "You are a professional nutritionist providing quick, data-driven answers. "
      : "You are an expert nutritionist and fitness coach. ";

    if (athlete) {
      context += `\n\nAthlete Profile:\n- Name: ${athlete.name}\n`;
      if (athlete.age) context += `- Age: ${athlete.age}\n`;
      if (athlete.sport_type) context += `- Sport: ${athlete.sport_type}\n`;
      if (athlete.fitness_goal) context += `- Goal: ${athlete.fitness_goal}\n`;
      if (athlete.dietary_restrictions) context += `- Dietary Restrictions: ${athlete.dietary_restrictions}\n`;
    }

    if (recentMetrics && recentMetrics.length > 0) {
      context += "\n\nRecent Fitness Metrics:\n";
      recentMetrics.forEach((m: any) => {
        context += `- ${m.date}: `;
        if (m.weight) context += `Weight ${m.weight}kg, `;
        if (m.body_fat_percentage) context += `Body Fat ${m.body_fat_percentage}%, `;
        if (m.muscle_mass) context += `Muscle ${m.muscle_mass}kg, `;
        if (m.workout_performance_score) context += `Workout ${m.workout_performance_score}/10, `;
        if (m.recovery_score) context += `Recovery ${m.recovery_score}/10`;
        context += "\n";
      });
    }

    if (recentNutrition && recentNutrition.length > 0) {
      context += "\n\nRecent Nutrition Logs:\n";
      const dailyTotals = new Map();
      recentNutrition.forEach((n: any) => {
        const existing = dailyTotals.get(n.date) || { calories: 0, protein: 0, carbs: 0, fats: 0 };
        dailyTotals.set(n.date, {
          calories: existing.calories + (n.calories || 0),
          protein: existing.protein + (n.protein_grams || 0),
          carbs: existing.carbs + (n.carbs_grams || 0),
          fats: existing.fats + (n.fats_grams || 0),
        });
      });
      dailyTotals.forEach((totals, date) => {
        context += `- ${date}: ${Math.round(totals.calories)}kcal (P: ${Math.round(totals.protein)}g, C: ${Math.round(totals.carbs)}g, F: ${Math.round(totals.fats)}g)\n`;
      });
    }

    if (relevantDocs && relevantDocs.length > 0) {
      context += "\n\nRelevant Knowledge Base:\n";
      relevantDocs.forEach((doc: any) => {
        context += `\n${doc.title}:\n${doc.content}\n`;
      });
    }

    const AI_BASE_URL = Deno.env.get("AI_BASE_URL") || "https://api.openai.com/v1";

    const chatResponse = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "MiniMax-M2.7-highspeed",
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(context, queryType),
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: queryType.isQuick ? 0.3 : 0.7,
        max_tokens: queryType.isQuick ? 600 : 800,
      }),
    });

    if (!chatResponse.ok) {
      const errorDetail = await chatResponse.text();
      console.error(`AI Provider Error (${chatResponse.status}):`, errorDetail);
      throw new Error(`AI Provider returned error ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    
    if (!chatData.choices || chatData.choices.length === 0) {
      console.error("AI Provider returned empty choices:", chatData);
      throw new Error("AI Provider returned an empty response");
    }

    const response = chatData.choices[0].message.content;

    return new Response(
      JSON.stringify({ response }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Chat Function Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: "Please check AI provider settings or API key."
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});