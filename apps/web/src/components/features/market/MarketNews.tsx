'use client'
import React, { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'

export default function MarketNews() {
  const [activeTab, setActiveTab] = useState<'latest' | 'saved'>('latest')
  const [articles, setArticles] = useState<any[]>([])
  const [savedArticles, setSavedArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('kisan_seva_saved_news')
    if (saved) {
      try {
        setSavedArticles(JSON.parse(saved))
      } catch (e) {}
    }
    
    fetch('/api/v1/news')
      .then(r => r.json())
      .then(d => {
        if (d.success) setArticles(d.articles)
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleSave = (article: any) => {
    let newSaved;
    if (savedArticles.some(a => a.id === article.id)) {
      newSaved = savedArticles.filter(a => a.id !== article.id)
    } else {
      newSaved = [...savedArticles, article]
    }
    setSavedArticles(newSaved)
    localStorage.setItem('kisan_seva_saved_news', JSON.stringify(newSaved))
  }

  const displayList = activeTab === 'latest' ? articles : savedArticles;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--color-bone)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 16px 0', fontSize: '1.125rem' }}>Market News</h2>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => setActiveTab('latest')} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', paddingBottom: '4px', fontWeight: 600, fontSize: '0.875rem', color: activeTab === 'latest' ? 'var(--color-primary)' : 'var(--color-bark)', borderBottom: activeTab === 'latest' ? '2px solid var(--color-primary)' : '2px solid transparent' }}
          >
            Latest News
          </button>
          <button 
            onClick={() => setActiveTab('saved')} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', paddingBottom: '4px', fontWeight: 600, fontSize: '0.875rem', color: activeTab === 'saved' ? 'var(--color-primary)' : 'var(--color-bark)', borderBottom: activeTab === 'saved' ? '2px solid var(--color-primary)' : '2px solid transparent' }}
          >
            Saved ({savedArticles.length})
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto' }}>
        {loading && activeTab === 'latest' ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="spin" size={24} color="var(--color-honey-amber)" /></div>
        ) : displayList.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-bark)', fontSize: '0.875rem' }}>
            {activeTab === 'saved' ? "You haven't saved any news yet." : "No news available at the moment."}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayList.map((news, idx) => {
              const isSaved = savedArticles.some(a => a.id === news.id);
              return (
                <div key={news.id} style={{ padding: '16px 0', borderBottom: idx < displayList.length - 1 ? '1px solid var(--color-bone)' : 'none', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <a href={news.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--color-ink)' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px', lineHeight: 1.4, transition: 'color 0.2s', cursor: 'pointer' }} 
                           onMouseOver={e => e.currentTarget.style.color = 'var(--color-primary)'}
                           onMouseOut={e => e.currentTarget.style.color = 'var(--color-ink)'}>
                        {news.title}
                      </div>
                    </a>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-bark)' }}>{news.date}</div>
                  </div>
                  <button 
                    onClick={() => toggleSave(news)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: isSaved ? 'var(--color-primary)' : 'var(--color-bark)', flexShrink: 0, transition: 'color 0.2s', transform: isSaved ? 'scale(1.1)' : 'scale(1)' }}
                    title={isSaved ? "Unsave article" : "Save article"}
                  >
                    {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

