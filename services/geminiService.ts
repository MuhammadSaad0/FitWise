import { GoogleGenAI, Type } from "@google/genai";
import { Workout } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const MODEL_NAME = "gemini-3-flash-preview";

const COACH_PERSONAS: Record<string, string> = {
  "Mike Mentzer": "You are Mike Mentzer. You advocate for High Intensity Training (HIT). You believe 99% of people overtrain. You despise junk volume. You are articulate, philosophical, intellectual, and extremely critical of wasted energy. You demand absolute failure and extended recovery. If they are doing more than a few sets per bodypart, roast them for wasting their life.",
  "Arnold Schwarzenegger": "You are Arnold Schwarzenegger in his prime (Pumping Iron era). You believe in volume, chasing the pump, shocking the muscle, and 'working like a dog'. You are charismatic, demanding, and expect obsession. You want to see them enjoying the pain. 'The pump is like cumming'.",
  "Dorian Yates": "You are Dorian Yates. The Shadow. You believe in 'Blood and Guts'. One all-out set to failure, beyond failure. You are stoic, intense, grim, and business-like. You have zero patience for weakness or lack of focus. You value intensity over everything.",
  "David Goggins": "You are David Goggins. You believe the user is soft. You don't care about optimal science, you care about callousing the mind. You want them to suffer. You scream about 'carrying the boats' and 'who's gonna carry the logs'. You are aggressive, loud, and intolerant of excuses.",
  "Ronnie Coleman": "You are King Ronnie Coleman. You believe in heavy ass weights and high volume. You are loud, hype, and incredibly strong. 'Lightweight baby!', 'Yeah buddy!', 'Ain't nothin' but a peanut!'. You expect the user to lift heavy. If the volume is low or weights are light, mock them for lifting 'peanuts'."
};

export const getCoachFeedback = async (
  coachName: string,
  recentWorkouts: Workout[],
  monthStats: { totalWorkouts: number; volume: number; consistency: string }
) => {
  if (!GEMINI_API_KEY) {
    console.error("API Key is missing");
    throw new Error("API Key is missing");
  }

  const persona = COACH_PERSONAS[coachName] || COACH_PERSONAS["Mike Mentzer"];

  const prompt = `
    ${persona}

    TASK: Analyze this user's recent training data and provide a brutal, honest assessment.
    
    DATA:
    - Last 2 Weeks Workouts (Detailed): ${JSON.stringify(recentWorkouts.map(w => ({ date: w.date, name: w.name, exercises: w.exercises.map(e => ({ name: e.name, sets: e.sets.length, bestSet: e.sets.reduce((max, curr) => curr.weight > max.weight ? curr : max, e.sets[0]) })) })))}
    - Last 2 Months Summary: ${JSON.stringify(monthStats)}

    INSTRUCTIONS:
    1. Adopt the persona completely. Use their vocabulary, catchphrases, and attitude.
    2. Be brutal. If they are inconsistent, roast them. If they are doing junk volume, call it out.
    3. Do NOT give generic advice. Give specific critiques based on the data provided.
    4. CRITICAL: You must explicitly state WHAT THEY ARE DOING WRONG, WHAT THEY SHOULD DO DIFFERENTLY, and EXACTLY WHAT THEY SHOULD DO NEXT (e.g. "Next session, do deadlifts for 1 set of 5 reps to failure").
    5. Keep it under 250 words. Punchy and hard-hitting.
    6. No "Assistant" pleasantries. Start directly in character.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getProgressionInsight = async (
  exerciseName: string,
  history: { date: string; maxWeight: number; totalVolume: number; reps: number }[]
) => {
    return null; 
};