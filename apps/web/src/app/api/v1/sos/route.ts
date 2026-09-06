import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Haversine formula to calculate distance in KM between two coordinates
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and Longitude are required' }, { status: 400 });
    }

    const targetLat = parseFloat(lat);
    const targetLng = parseFloat(lng);
    const radiusKm = radiusStr ? parseFloat(radiusStr) : 50; 

    // Fetch alerts from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: allAlerts, error } = await supabase
      .from('alerts')
      .select('*')
      .gte('timestamp', yesterday)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    // Filter by Haversine distance
    const nearbyAlerts = (allAlerts || []).map(alert => {
      const distance = getDistanceFromLatLonInKm(targetLat, targetLng, alert.latitude, alert.longitude);
      return { ...alert, distance };
    }).filter(alert => alert.distance <= radiusKm);

    return NextResponse.json({ alerts: nearbyAlerts });
  } catch (error: any) {
    console.error("SOS GET Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, latitude, longitude } = body;

    if (!type || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Type, latitude, and longitude are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('alerts')
      .insert([{ type, latitude, longitude }]);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'SOS Alert broadcasted successfully' });
  } catch (error: any) {
    console.error("SOS POST Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to broadcast alert' }, { status: 500 });
  }
}
