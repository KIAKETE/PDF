import React from 'react';
export default function PDFViewer({ src }) {
  return (
    <div style={{ width: '100%', height: '80vh', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden' }}>
      <iframe title="PDF Preview" src={src} style={{ width: '100%', height: '100%', border: 'none' }} />
    </div>
  );
}