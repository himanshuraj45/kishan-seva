'use client';

import React, { useState, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Lock, FolderOpen, X, Plus, Eye } from 'lucide-react';

const PAGE_BG = { background: '#f9fafb', minHeight: '100vh', paddingBottom: 100 };

type Doc = {
  id: string;
  name: string;
  category: string;
  dateAdded: string;
  size: string;
  dataUrl?: string;
  type: string;
};

const CATEGORIES = ['All', 'Land Records', 'KCC / Bank', 'Soil Health Card', 'Insurance', 'Government ID', 'Other'];

// ─── IndexedDB Helper ────────────────────────────────────────────────────────
const DB_NAME = 'KisanSevaDocsDB';
const STORE_NAME = 'docFilesV2';

function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveFileToDB(id: string, dataUrl: string) {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, dataUrl });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) { console.error('IDB save error', e); }
}

async function getFileFromDB(id: string): Promise<string | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          resolve(req.result.dataUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) { console.error('IDB get error', e); return null; }
}

async function deleteFileFromDB(id: string) {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) { console.error('IDB delete error', e); }
}

export default function DocumentLockerPage() {
  const [docs, setDocs] = useState<Doc[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('kisanseva_documents');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [filter, setFilter] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState<Doc | null>(null);
  const [uploadForm, setUploadForm] = useState({ name: '', category: 'Land Records' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveDocs = (updated: Doc[]) => {
    setDocs(updated);
    // Store only metadata (not dataUrl) to avoid localStorage quota
    const meta = updated.map(d => ({ ...d, dataUrl: d.dataUrl ? '[stored]' : undefined }));
    localStorage.setItem('kisanseva_documents', JSON.stringify(meta));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const newDoc: Doc = {
        id: Date.now().toString(),
        name: uploadForm.name || selectedFile.name,
        category: uploadForm.category,
        dateAdded: new Date().toLocaleDateString('en-IN'),
        size: (selectedFile.size / 1024).toFixed(1) + ' KB',
        dataUrl: reader.result as string,
        type: selectedFile.type,
      };
      
      // Save full file to IndexedDB
      await saveFileToDB(newDoc.id, newDoc.dataUrl as string);
      
      saveDocs([newDoc, ...docs]);
      setShowUpload(false);
      setSelectedFile(null);
      setUploadForm({ name: '', category: 'Land Records' });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = async (id: string) => {
    await deleteFileFromDB(id);
    saveDocs(docs.filter(d => d.id !== id));
  };

  const handleView = async (doc: Doc) => {
    let dataUrl = doc.dataUrl;
    if (dataUrl === '[stored]' || !dataUrl) {
      const dbUrl = await getFileFromDB(doc.id);
      if (dbUrl) {
         dataUrl = dbUrl;
      } else {
         alert('File data not found in local database (it may have been cleared).');
         return;
      }
    }
    setPreview({ ...doc, dataUrl });
  };

  const filtered = filter === 'All' ? docs : docs.filter(d => d.category === filter);

  const catIcon = (cat: string) => {
    const icons: Record<string, string> = {
      'Land Records': '🗺️', 'KCC / Bank': '💳', 'Soil Health Card': '🧪',
      'Insurance': '🛡️', 'Government ID': '🪪', 'Other': '📄'
    };
    return icons[cat] || '📄';
  };

  return (
    <div style={PAGE_BG}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '32px 28px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Lock size={20} color="#2d6a27" />
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#2d6a27', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Encrypted Locally</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.03em' }}>Document Locker</h1>
            <p style={{ color: '#4b5563', margin: 0 }}>Store KCC, land records, soil card — all saved securely on your device.</p>
          </div>
          <button onClick={() => setShowUpload(true)} style={{ background: '#2d6a27', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} /> Upload Doc
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{ padding: '8px 16px', borderRadius: 20, fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', background: filter === cat ? '#2d6a27' : '#f3f4f6', color: filter === cat ? '#fff' : '#4b5563' }}>
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9ca3af' }}>
            <FolderOpen size={56} style={{ marginBottom: 16, opacity: 0.4 }} />
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>No documents yet</div>
            <div style={{ fontSize: '0.9rem' }}>Upload your KCC, land records, or soil health card to keep them safe.</div>
            <button onClick={() => setShowUpload(true)} style={{ marginTop: 20, background: '#2d6a27', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Upload First Document</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {filtered.map(doc => (
              <div key={doc.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ede7', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '2.5rem' }}>{catIcon(doc.category)}</div>
                  <span style={{ background: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}>{doc.category}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4, fontSize: '1rem' }}>{doc.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{doc.dateAdded} · {doc.size}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button onClick={() => handleView(doc)} style={{ flex: 1, background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: '8px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: '0.875rem' }}>
                    <Eye size={14} /> View
                  </button>
                  <button onClick={() => handleDelete(doc.id)} style={{ flex: 1, background: '#fef2f2', color: '#dc2626', border: 'none', padding: '8px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: '0.875rem' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info banner */}
        <div style={{ marginTop: 32, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 12 }}>
          <Lock size={20} color="#1d4ed8" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
            <strong>100% Private:</strong> Your documents are stored only on this device using your browser's local storage. They are never uploaded to any server and cannot be accessed by anyone else.
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowUpload(false)} />
          <div style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: 440, borderRadius: 20, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Upload Document</h3>
              <button onClick={() => setShowUpload(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Document Name</label>
                <input value={uploadForm.name} onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })} placeholder="e.g., Khatoni - Plot 2A" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', outline: 'none', fontSize: '1rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Category</label>
                <select value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', outline: 'none', fontSize: '1rem' }}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>File</label>
                <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed #d1d5db', borderRadius: 12, padding: '32px', textAlign: 'center', cursor: 'pointer', background: selectedFile ? '#f0fdf4' : '#f9fafb' }}>
                  {selectedFile ? (
                    <div><div style={{ fontSize: '1.5rem', marginBottom: 4 }}>✅</div><div style={{ fontWeight: 600, color: '#111827' }}>{selectedFile.name}</div><div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{(selectedFile.size / 1024).toFixed(1)} KB</div></div>
                  ) : (
                    <div><Upload size={28} color="#9ca3af" style={{ marginBottom: 8 }} /><div style={{ fontWeight: 600, color: '#374151' }}>Click to select file</div><div style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>JPG, PNG, PDF</div></div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
              <button type="submit" disabled={!selectedFile} style={{ width: '100%', padding: '14px', background: selectedFile ? '#2d6a27' : '#d1d5db', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: selectedFile ? 'pointer' : 'not-allowed' }}>Save Document</button>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && preview.dataUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }} onClick={() => setPreview(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 16, maxWidth: 700, width: '100%', maxHeight: '90vh', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ fontWeight: 700 }}>{preview.name}</span>
              <button onClick={() => setPreview(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            <div style={{ overflow: 'auto', maxHeight: 'calc(90vh - 60px)' }}>
              {preview.type.startsWith('image') ? (
                <img src={preview.dataUrl} alt={preview.name} style={{ width: '100%', display: 'block' }} />
              ) : (
                <iframe src={preview.dataUrl} style={{ width: '100%', height: '80vh', border: 'none' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
