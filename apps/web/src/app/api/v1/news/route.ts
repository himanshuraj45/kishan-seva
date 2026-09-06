import { NextResponse } from 'next/server';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const rssUrl = 'https://news.google.com/rss/search?q=agriculture+india&hl=en-IN&gl=IN&ceid=IN:en';
    const resp = await fetch(rssUrl, { next: { revalidate: 3600 } });
    if (!resp.ok) throw new Error('Failed to fetch RSS feed');
    const xml = await resp.text();
    
    // Very simple regex-based XML extraction for items
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
      const itemXml = match[1];
      const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(itemXml);
      const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(itemXml);
      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemXml);
      
      if (titleMatch && linkMatch) {
        let title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim();
        const link = linkMatch[1].trim();
        let pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
        
        // Format date simply
        if (pubDate) {
          const d = new Date(pubDate);
          pubDate = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        } else {
          pubDate = 'Today';
        }

        // Clean up title (remove trailing source name if present, like " - The Times of India")
        title = title.replace(/\s*-\s*[^>]*$/, '');

        items.push({ title, link, date: pubDate, id: link });
      }
    }
    
    return NextResponse.json({ success: true, articles: items });
  } catch (error: any) {
    console.error("News fetch error:", error);
    // Fallback static data
    return NextResponse.json({
      success: true,
      articles: [
        { id: '1', title: 'Government announces MSP hike for Rabi crops', date: 'Today', link: '#' },
        { id: '2', title: 'Export ban on non-basmati rice lifted', date: 'Yesterday', link: '#' },
        { id: '3', title: 'Weather forecast indicates favorable conditions for sowing', date: '2 days ago', link: '#' },
        { id: '4', title: 'New agri-tech solutions showcased at national expo', date: '3 days ago', link: '#' },
      ]
    });
  }
}

