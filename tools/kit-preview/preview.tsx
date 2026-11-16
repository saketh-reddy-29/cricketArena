import React from 'react';
import { createRoot } from 'react-dom/client';
import KitPreviewPanel from '../../src/components/KitPreviewPanel';
const q = new URLSearchParams(location.search);
createRoot(document.getElementById('root')!).render(
  <div style={{ position: 'relative', width: 900, height: 620, background: '#0b1220' }}>
    <KitPreviewPanel initialTeam={q.get('team') || 'Australia'} onClose={() => {}} />
  </div>
);
setTimeout(() => { (window as any).__done = true; }, 9000);
