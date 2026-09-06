/**
 * KisanSeva — Shared TypeScript Type Definitions
 *
 * Central type registry for all domain entities used across
 * the KisanSeva application. Import from "@/types" in any file.
 */

// ── User & Profile ──────────────────────────────────────────────────────────
export interface FarmerProfile {
  id: string; name: string; phone?: string; email?: string;
  farm_location?: string; farm_size?: string; primary_crops?: string;
  created_at?: string; updated_at?: string;
}

// ── Plot & Crop ─────────────────────────────────────────────────────────────
export interface Plot {
  id: string; name: string; crop: string;
  area: string; city: string; lat?: number; lon?: number;
}
export type CropStage = 'Sowing' | 'Vegetative' | 'Flowering' | 'Fruiting' | 'Harvest' | string;

// ── Weather ─────────────────────────────────────────────────────────────────
export interface WeatherCurrent {
  temp: number; humidity: number; description: string;
  precipitation?: number; wind_speed?: number;
}
export interface WeatherAdvisory {
  irrigation: string; diseaseRisk: string; sprayWindow: string;
}
export interface WeatherResponse {
  success: boolean; current: WeatherCurrent; advisory: WeatherAdvisory; city: string;
}

// ── Disease Diagnosis ───────────────────────────────────────────────────────
export interface DiagnosisResult {
  disease: string; crop: string; confidence: number;
  severity: 'low' | 'moderate' | 'high'; description: string;
  treatment: string[]; prevention?: string; organicAlternative?: string;
  provider?: 'gemini' | 'nvidia' | 'groq';
}

// ── Market & Mandi ──────────────────────────────────────────────────────────
export interface MandiPrice {
  mandiName: string; district: string; state: string;
  minPrice: number; maxPrice: number; modalPrice: number; date: string;
}
export interface MarketResponse {
  success: boolean; commodity: string; highestPrice: number;
  bestMandi: MandiPrice; allMandis: MandiPrice[];
}

// ── Notifications ────────────────────────────────────────────────────────────
export interface Notification {
  id: string; icon: 'water' | 'alert' | 'market' | 'bell' | 'check';
  title: string; body: string; time: string; read: boolean;
}

// ── AI Agent ─────────────────────────────────────────────────────────────────
export interface AgentChatRequest {
  query: string; language?: string; user_id?: string;
  plot_id?: string; context?: Record<string, unknown>;
}
export interface AgentChatResponse {
  agent_name: string; success: boolean;
  result: { text: string; type: string; provider: string };
  confidence: number; language: string;
  processing_time_ms: number; sources: string[];
}

// ── Cold Storage ──────────────────────────────────────────────────────────────
export interface StorageFacility {
  id: string; name: string; type: string; address: string;
  city: string; state: string; capacity: string;
  lat: number; lon: number; distanceKm: number;
  phone?: string; verified?: boolean;
}

// ── Community ────────────────────────────────────────────────────────────────
export interface CommunityPost {
  id: string; authorName: string; authorLocation: string;
  avatarColor: string; content: string; timestamp: string;
  likes: number; isLiked: boolean;
  replies: Array<{ id: string; author: string; content: string; timestamp: string }>;
  aiResponse?: string;
}

// ── B2B Contract ─────────────────────────────────────────────────────────────
export interface B2BContract {
  id: string; buyerName: string; buyerCategory: string;
  commodity: string; quantity: string; pricePerKg: number;
  totalValue: number; deliveryDate: string; location: string;
  status: 'open' | 'negotiating' | 'accepted' | 'completed';
}
