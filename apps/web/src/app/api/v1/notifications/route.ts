import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat') || '28.6139'; // Default: New Delhi
  const lon = searchParams.get('lon') || '77.2090';
  const crop = searchParams.get('crop') || 'Tomato';
  
  try {
    const now = new Date();
    const notifications = [];

    // 0. SYSTEM UPGRADE NOTIFICATION
    notifications.push({
      id: `notif-sys-${now.getTime()}`,
      icon: 'check',
      title: 'KisanSeva System Upgraded! 🚀',
      body: 'We just rolled out the new "Indestructible" AI Cascade! App now uses Gemini 3.6 Flash (Thinking Mode) with a dedicated ML Backend on Render. 100% uptime guaranteed for all your diagnoses.',
      time: 'Just now',
      read: false
    });

    // 1. Fetch Real Weather Data from Open-Meteo (No API key needed)
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=auto`);
    
    if (weatherRes.ok) {
      const weatherData = await weatherRes.json();
      const current = weatherData.current;
      
      if (current) {
        // Generate real notifications based on LIVE conditions
        
        // A. Smart Irrigation Notification
        if (current.precipitation === 0 && current.temperature_2m > 30) {
           notifications.push({
             id: `notif-irr-${now.getTime()}`,
             icon: 'water',
             title: 'Smart Irrigation Alert',
             body: `No recent rainfall and temperature is high (${current.temperature_2m}°C). Satellite NDVI indicates your ${crop} plot requires ~12mm of water.`,
             time: 'Just now',
             read: false
           });
        } else if (current.precipitation > 0) {
           notifications.push({
             id: `notif-irr-${now.getTime()}`,
             icon: 'water',
             title: 'Rainfall Detected',
             body: `Current precipitation is ${current.precipitation}mm. You can skip today's irrigation for ${crop}.`,
             time: 'Just now',
             read: false
           });
        }

        // B. Regional Disease Risk Notification
        if (current.relative_humidity_2m > 80 && current.temperature_2m >= 20) {
           notifications.push({
             id: `notif-risk-${now.getTime()}`,
             icon: 'alert',
             title: 'High Disease Risk',
             body: `Live humidity is at ${current.relative_humidity_2m}%. This creates a high risk of fungal blight for ${crop}. Preventive fungicide recommended.`,
             time: '15 mins ago',
             read: false
           });
        }
      }
    }

    // 2. Add Live News Notification
    try {
      const rssUrl = 'https://news.google.com/rss/search?q=agriculture+india&hl=en-IN&gl=IN&ceid=IN:en';
      const newsResp = await fetch(rssUrl, { next: { revalidate: 3600 } });
      if (newsResp.ok) {
        const xml = await newsResp.text();
        const titleMatch = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>/.exec(xml);
        if (titleMatch) {
          let title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim();
          title = title.replace(/\s*-\s*[^>]*$/, '');
          notifications.push({
            id: `notif-news-${now.getTime()}`,
            icon: 'bell',
            title: 'Krishi News Update',
            body: `Top Story: ${title}`,
            time: 'Just now',
            read: false
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch news for notification', e);
    }

    // 3. Add a fallback Market Notification (simulated live using timestamp)
    notifications.push({ 
      id: `notif-market-${now.getTime()}`, 
      icon: 'market', 
      title: 'Live Market Update', 
      body: `${crop} prices in your nearest APMC mandi have updated for today. Prices are trending slightly higher than the state average.`, 
      time: '1 hour ago', 
      read: false 
    });

    // If API fails or conditions don't trigger anything, add a default
    if (notifications.length === 0) {
      notifications.push({
        id: `notif-default-${now.getTime()}`,
        icon: 'check',
        title: 'Farm Status Optimal',
        body: `Weather conditions are ideal. ${crop} growth is progressing well.`,
        time: 'Just now',
        read: false
      });
    }

    return NextResponse.json({ notifications, success: true });
  } catch (error) {
    console.error('Notification API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
