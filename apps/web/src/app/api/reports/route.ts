import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      throw new Error("GROQ_API_KEY is not configured in .env.local");
    }

    const prompt = `Generate a JSON array of exactly 12 realistic, current agricultural reports for different states in India. 
Do not include any text other than the raw JSON array.
Each report object must match this schema:
{
  "id": <unique number>,
  "lat": <latitude between 10.0 and 32.0>,
  "lng": <longitude between 70.0 and 92.0>,
  "status": <must be exactly one of: "Critical", "Warning", "Healthy">,
  "title": <a short, realistic agricultural observation (e.g. "Mild pest activity in cotton", "Optimal monsoon coverage for paddy", "Severe water stress detected")>,
  "location": <Name of the Indian State or Region>
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", 
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Groq API Error");
    }

    let rawText = data.choices[0].message.content;
    
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    let reports = JSON.parse(rawText);
    
    if (reports && typeof reports === 'object' && !Array.isArray(reports)) {
      const firstKey = Object.keys(reports)[0];
      reports = reports[firstKey];
    }

    return NextResponse.json(reports);

  } catch (error: any) {
    console.error("Failed to fetch Groq reports:", error);
    
    // Extensive fallback dataset so the map never looks empty if the API fails
    return NextResponse.json([
      { id: 1, lat: 30.9, lng: 75.8, status: "Critical", title: "Yellow Rust detected in Wheat", location: "Punjab" },
      { id: 2, lat: 29.0, lng: 76.0, status: "Healthy", title: "Optimal Soil Moisture", location: "Haryana" },
      { id: 3, lat: 26.8, lng: 80.9, status: "Warning", title: "Late Blight risk in Potatoes", location: "Uttar Pradesh" },
      { id: 4, lat: 22.9, lng: 78.6, status: "Healthy", title: "Soybean crop progressing well", location: "Madhya Pradesh" },
      { id: 5, lat: 20.5, lng: 76.5, status: "Critical", title: "Severe Water Stress in Cotton", location: "Maharashtra" },
      { id: 6, lat: 15.3, lng: 75.1, status: "Warning", title: "Pest sighting in Sugarcane", location: "Karnataka" },
      { id: 7, lat: 11.1, lng: 77.3, status: "Healthy", title: "Excellent Monsoon coverage", location: "Tamil Nadu" },
      { id: 8, lat: 23.2, lng: 87.8, status: "Warning", title: "Flooding risk in Paddy fields", location: "West Bengal" },
      { id: 9, lat: 26.1, lng: 91.7, status: "Healthy", title: "Tea estates reporting normal growth", location: "Assam" },
      { id: 10, lat: 21.2, lng: 81.6, status: "Critical", title: "Stem Borer attack in Rice", location: "Chhattisgarh" },
      { id: 11, lat: 28.6, lng: 77.2, status: "Warning", title: "Heatwave affecting vegetable crops", location: "Delhi NCR" },
      { id: 12, lat: 27.0, lng: 73.0, status: "Critical", title: "Locust swarm warning", location: "Rajasthan" },
      { id: 13, lat: 23.0, lng: 72.0, status: "Healthy", title: "Groundnut yield expectations high", location: "Gujarat" },
      { id: 14, lat: 19.0, lng: 82.0, status: "Warning", title: "Uneven rainfall impacting millet", location: "Odisha" },
      { id: 15, lat: 25.6, lng: 85.1, status: "Healthy", title: "Maize plantations thriving", location: "Bihar" },
      { id: 16, lat: 34.0, lng: 74.8, status: "Warning", title: "Frost risk for Apple orchards", location: "Jammu & Kashmir" },
      { id: 17, lat: 31.1, lng: 77.1, status: "Healthy", title: "Favorable conditions for stone fruits", location: "Himachal Pradesh" },
      { id: 18, lat: 10.8, lng: 76.2, status: "Critical", title: "Fungal infection in Cardamom", location: "Kerala" },
      { id: 19, lat: 17.3, lng: 78.4, status: "Warning", title: "Groundwater depletion noted", location: "Telangana" },
      { id: 20, lat: 16.5, lng: 80.6, status: "Healthy", title: "Chilli crops show robust health", location: "Andhra Pradesh" },
      { id: 21, lat: 23.3, lng: 85.3, status: "Warning", title: "Minor nutrient deficiency in pulses", location: "Jharkhand" },
      { id: 22, lat: 30.3, lng: 78.0, status: "Healthy", title: "Organic farming yields stabilizing", location: "Uttarakhand" }
    ]);
  }
}
