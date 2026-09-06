/**
 * KisanSeva — Live Weather API Route
 * Fetches current weather + 10-day forecast from Open-Meteo (Free, No API Key)
 * for a given lat/lon. Used by Schedule page and WeatherAdvisoryAgent.
 */
import { NextRequest, NextResponse } from 'next/server'

// Crop coefficient (Kc) table for ET-based irrigation estimation
const KC_TABLE: Record<string, number> = {
  tomato: 1.15, wheat: 1.10, rice: 1.20, potato: 1.05,
  onion: 1.00, cotton: 1.15, maize: 1.20, soybean: 1.15,
  default: 1.00,
}

// WMO Weather interpretation codes
function decodeWMO(code: number) {
  if (code === 0) return { desc: 'Clear sky', icon: '01d' }
  if (code === 1) return { desc: 'Mainly clear', icon: '02d' }
  if (code === 2) return { desc: 'Partly cloudy', icon: '03d' }
  if (code === 3) return { desc: 'Overcast', icon: '04d' }
  if ([45, 48].includes(code)) return { desc: 'Fog', icon: '50d' }
  if ([51, 53, 55].includes(code)) return { desc: 'Drizzle', icon: '09d' }
  if ([56, 57].includes(code)) return { desc: 'Freezing Drizzle', icon: '09d' }
  if ([61, 63, 65].includes(code)) return { desc: 'Rain', icon: '10d' }
  if ([66, 67].includes(code)) return { desc: 'Freezing Rain', icon: '13d' }
  if ([71, 73, 75].includes(code)) return { desc: 'Snow fall', icon: '13d' }
  if (code === 77) return { desc: 'Snow grains', icon: '13d' }
  if ([80, 81, 82].includes(code)) return { desc: 'Rain showers', icon: '09d' }
  if ([85, 86].includes(code)) return { desc: 'Snow showers', icon: '13d' }
  if (code === 95) return { desc: 'Thunderstorm', icon: '11d' }
  if ([96, 99].includes(code)) return { desc: 'Thunderstorm with hail', icon: '11d' }
  return { desc: 'Clear sky', icon: '01d' }
}

function estimateIrrigation(
  tempMax: number, tempMin: number, humidity: number,
  windSpeed: number, rainfall: number, crop: string, stageFactor = 1.0
): number {
  const Ra = 15.0  // approx extraterrestrial radiation MJ/m²/day
  const et0 = 0.0023 * (tempMax - tempMin) ** 0.5 * ((tempMax + tempMin) / 2 + 17.8) * Ra * 0.408
  const kc  = (KC_TABLE[crop.toLowerCase()] ?? KC_TABLE.default) * stageFactor
  const etc = et0 * kc
  const netIrrigation = Math.max(0, Math.round(etc - rainfall))
  return netIrrigation
}

// Crop-specific disease & pest risk profiles
const CROP_PEST_MAP: Record<string, { pest: string; fungal: string; bacterialCond: string }> = {
  tomato:  { pest: 'aphids and fruit borers', fungal: 'early blight (Alternaria)', bacterialCond: 'bacterial wilt' },
  wheat:   { pest: 'aphids and yellow rust', fungal: 'powdery mildew', bacterialCond: 'leaf blight' },
  rice:    { pest: 'stem borers and BPH', fungal: 'blast disease (Magnaporthe)', bacterialCond: 'bacterial leaf blight' },
  onion:   { pest: 'thrips and leaf miners', fungal: 'purple blotch (Alternaria)', bacterialCond: 'neck rot' },
  cotton:  { pest: 'whitefly and bollworm', fungal: 'grey mildew', bacterialCond: 'angular leaf spot' },
  potato:  { pest: 'aphids and tuber moth', fungal: 'late blight (Phytophthora)', bacterialCond: 'blackleg' },
  maize:   { pest: 'fall armyworm and stem borer', fungal: 'grey leaf spot', bacterialCond: 'bacterial stalk rot' },
  soybean: { pest: 'pod borers and whitefly', fungal: 'rust (Phakopsora)', bacterialCond: 'bacterial pustule' },
  default: { pest: 'aphids', fungal: 'fungal leaf spots', bacterialCond: 'bacterial blight' },
}

function getCropProfile(crop: string) {
  const key = Object.keys(CROP_PEST_MAP).find(k => crop.toLowerCase().includes(k)) || 'default'
  return CROP_PEST_MAP[key]
}

function diseaseRisk(humidity: number, tempAvg: number, rainfall: number, crop: string) {
  const profile = getCropProfile(crop)
  const fungalRisk =
    humidity > 85 && tempAvg >= 18 && tempAvg <= 30 ? 'high'
    : humidity > 70 && tempAvg >= 15 ? 'moderate'
    : 'low'

  const bacterialRisk =
    humidity > 80 && tempAvg > 25 && rainfall > 0 ? 'moderate' : 'low'

  const pestRisk = tempAvg > 35 ? 'moderate' : 'low'

  return { fungalRisk, bacterialRisk, pestRisk, profile }
}

// Crop-specific irrigation tips
const IRRIGATION_TIPS: Record<string, string> = {
  tomato:  'Apply via drip at root zone, avoid wetting foliage to prevent blight.',
  wheat:   'Use flood or furrow irrigation; critical at tillering and grain-fill stages.',
  rice:    'Maintain 5cm standing water in paddy fields. Drain before harvest.',
  onion:   'Furrow or drip irrigation preferred. Avoid overhead watering near bulbing stage.',
  cotton:  'Drip irrigation at 0.6–0.8 ET. Critical during boll formation.',
  potato:  'Sprinkler or furrow. Keep soil moist but avoid waterlogging to prevent rot.',
  maize:   'Flood or furrow; critical at tasseling and silking. Avoid moisture stress.',
  soybean: 'Drip or sprinkler at 0.7 ET. Critical at flowering and pod fill stages.',
  default: 'Irrigate based on soil moisture. Avoid over-irrigation to prevent root rot.',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat   = searchParams.get('lat')
  const lon   = searchParams.get('lon')
  const city  = searchParams.get('city')
  const crop  = searchParams.get('crop') || 'default'
  const stage = searchParams.get('stage') || 'vegetative'

  try {
    let resolvedLat = lat
    let resolvedLon = lon
    let locationName = city || 'Your Location'

    // ── Geocode city name if lat/lon not provided using Open-Meteo ─────────
    if ((!lat || !lon) && city) {
      try {
        const geoResp = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&format=json`
        )
        if (geoResp.ok) {
          const geoData = await geoResp.json()
          if (geoData.results && geoData.results.length) {
            resolvedLat = geoData.results[0].latitude.toString()
            resolvedLon = geoData.results[0].longitude.toString()
            locationName = `${geoData.results[0].name}, ${geoData.results[0].country || ''}`
          }
        }
      } catch (e) {
        console.warn('Geocoding failed, using fallback coordinates', e)
      }
    }

    // If still missing, fallback to central India
    if (!resolvedLat || !resolvedLon) {
      resolvedLat = '20.5937'
      resolvedLon = '78.9629'
    }

    // ── Fetch 10-day forecast and current weather from Open-Meteo ────────────
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${resolvedLat}&longitude=${resolvedLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=10`
    
    const weatherResp = await fetch(weatherUrl)
    if (!weatherResp.ok) {
      throw new Error(`Open-Meteo error: ${weatherResp.status}`)
    }

    const data = await weatherResp.json()

    // ── Process current weather ───────────────────────────
    const cwmo = decodeWMO(data.current.weather_code)
    const now = {
      temp:        Math.round(data.current.temperature_2m),
      feelsLike:   Math.round(data.current.apparent_temperature),
      humidity:    data.current.relative_humidity_2m,
      windSpeed:   Math.round(data.current.wind_speed_10m),
      rainfall24h: data.current.precipitation,
      rainChance:  data.current.precipitation > 0 ? 85 : 15, // Simplified rain chance
      description: cwmo.desc,
      icon:        cwmo.icon,
      locationName: locationName,
    }

    // ── Process daily forecast ────────────────────────────
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const daily = data.daily.time.map((timeStr: string, idx: number) => {
      const d = new Date(timeStr)
      const maxTemp = data.daily.temperature_2m_max[idx]
      const minTemp = data.daily.temperature_2m_min[idx]
      const rain = data.daily.precipitation_sum[idx]
      const windMax = data.daily.wind_speed_10m_max[idx]
      const wmo = decodeWMO(data.daily.weather_code[idx])

      const irrigMm = estimateIrrigation(
        maxTemp, minTemp, 60, // 60% avg humidity assumed for daily
        windMax, rain, crop,
        stage === 'germination' ? 0.5 : stage === 'harvest' ? 0.8 : 1.0
      )

      const risk = diseaseRisk(60, (maxTemp + minTemp) / 2, rain, crop)

      return {
        date:        timeStr,
        dayName:     days[d.getDay()],
        isToday:     idx === 0,
        maxTemp:     Math.round(maxTemp),
        minTemp:     Math.round(minTemp),
        humidity:    60,
        rainfall:    Math.round(rain * 10) / 10,
        windSpeed:   Math.round(windMax),
        description: wmo.desc,
        icon:        wmo.icon,
        irrigationMm: irrigMm,
        shouldIrrigate: irrigMm > 5,
        diseaseRisk: risk,
        sprayWindow: windMax < 15 && rain < 1 
          ? 'Ideal spray conditions (early morning)'
          : windMax > 20
          ? 'Avoid spraying — too windy'
          : 'Acceptable',
      }
    })

    // ── Today's advisory ──────────────────────────────────
    const todayData = daily[0] ?? null
    const advisory = todayData ? {
      irrigate:      todayData.shouldIrrigate,
      irrigationMm:  todayData.irrigationMm,
      urgency:       todayData.irrigationMm > 25 ? 'high' : todayData.irrigationMm > 10 ? 'moderate' : 'low',
      diseaseAlert:  todayData.diseaseRisk.fungalRisk === 'high'
        ? '⚠️ High fungal disease risk — consider preventive fungicide spray'
        : null,
      sprayWindow:   todayData.sprayWindow,
      generalAdvice: now.rainfall24h > 5
        ? 'Good rainfall received. Skip irrigation today. Watch for waterlogging.'
        : todayData.irrigationMm > 20
        ? `Irrigate ${todayData.irrigationMm}mm urgently — high evapotranspiration.`
        : `Moderate conditions. Irrigate ${todayData.irrigationMm}mm if soil feels dry.`,
      // Crop-aware, weather-aware advisory text
      irrigation: (() => {
        const profile = getCropProfile(crop)
        const tipKey = Object.keys(IRRIGATION_TIPS).find(k => crop.toLowerCase().includes(k)) || 'default'
        const tip = IRRIGATION_TIPS[tipKey]
        if (now.rainfall24h > 10) return `Good rainfall today (${now.rainfall24h}mm). Skip irrigation for ${crop}. Watch for waterlogging. ${tip}`
        if (todayData.irrigationMm > 20) return `⚠️ Irrigate ${todayData.irrigationMm}mm urgently — high evapotranspiration for ${crop} today. ${tip}`
        if (todayData.irrigationMm > 0) return `Apply ${todayData.irrigationMm}mm of water for ${crop} if topsoil feels dry. ${tip}`
        return `Soil moisture looks adequate for ${crop}. ${tip}`
      })(),
      diseaseRisk: (() => {
        const profile = todayData.diseaseRisk.profile
        if (todayData.diseaseRisk.fungalRisk === 'high')
          return `⚠️ High risk of ${profile.fungal} due to humidity & temperature. Spray Mancozeb or Copper Oxychloride preventively on ${crop}. Scout for ${profile.pest}.`
        if (todayData.diseaseRisk.fungalRisk === 'moderate')
          return `Moderate risk. Watch for early signs of ${profile.fungal}. Check for ${profile.pest} especially under leaves.`
        if (todayData.diseaseRisk.bacterialRisk === 'moderate')
          return `${profile.bacterialCond} risk elevated due to warm, moist conditions. Remove infected plants promptly.`
        if (todayData.diseaseRisk.pestRisk === 'moderate')
          return `High temperature may attract ${profile.pest}. Scout field early morning for ${crop}.`
        return `Low risk conditions for ${crop}. Standard weekly scouting for ${profile.pest} recommended.`
      })(),
      sprayAdvice: (() => {
        if (todayData.sprayWindow === 'Avoid spraying — too windy') return `🌬️ Wind speed too high today. Reschedule spray for ${crop} to early morning (06:00–08:00) on a calmer day.`
        if (todayData.sprayWindow.includes('Ideal')) return `✅ Ideal spray conditions today (early morning). Apply fungicide / pesticide for ${crop} between 06:00–08:00 AM.`
        return `Acceptable spray window. Avoid afternoon; prefer early morning to reduce evaporation.`
      })()
    } : null

    return NextResponse.json({
      success: true,
      location: {
        lat: parseFloat(resolvedLat!),
        lon: parseFloat(resolvedLon!),
        name: now.locationName,
      },
      current: now,
      daily,
      advisory,
      crop,
      stage,
      fetchedAt: new Date().toISOString(),
    })

  } catch (err: any) {
    console.error('[Weather API]', err)
    return NextResponse.json(
      { error: 'Weather fetch failed', message: err.message },
      { status: 500 }
    )
  }
}

