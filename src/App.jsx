import React, { useState, useRef } from 'react';
import PDFViewer from './components/PDFViewer';
import SignaturePad from './components/SignaturePad';
import api from './api';
import { findAnchorsInPdf } from './utils/findAnchor';

export default function App(){
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [status, setStatus] = useState('');
  const fieldsRef = useRef({});
  const [anchorInfo, setAnchorInfo] = useState(null);

  const handleAutoSign = async () => {
    if (!signatureDataUrl) { setStatus('Desenha a assinatura primeiro.'); return; }
    setStatus('Procurando ancoragem...');
    try {
      const matches = await findAnchorsInPdf('/template.pdf', 'Assinatura');
      if (!matches || matches.length === 0) { setStatus('Nenhuma ocorrência encontrada para "Assinatura".'); return; }
      // choose last occurrence (best for client signature)
      const best = matches.reduce((a,b)=> (b.y > a.y ? b : a), matches[0]);
      setAnchorInfo(best);
      setStatus(`Melhor match: página ${best.pageIndex+1}, x=${best.x.toFixed(1)}, y=${best.y.toFixed(1)}`);

      const signWidth = 160;
      const signHeight = 60;
      const offsetX = 10;
      const offsetY = 10;
      const signX = best.x + best.width + offsetX;
      const signY = best.y + offsetY;

      const payload = {
        pdfPath: 'template.pdf',
        signatureDataUrl,
        signPage: best.pageIndex,
        signX,
        signY,
        signWidth,
        signHeight,
        fields: {
          Nome: { value: fieldsRef.current.nome || '', page: 0, x: 80, y: 500, size: 10 }
        }
      };

      setStatus('Enviando para assinar...');
      const res = await api.post('/sign', payload);
      if (res.data?.ok) {
        setStatus(`Assinado ✅ Hash: ${res.data.hash}. Download: ${res.data.download}`);
      } else {
        setStatus('Erro: ' + (res.data?.error || 'resposta inesperada'));
      }
    } catch (err) {
      console.error(err);
      setStatus('Erro na ancoragem: ' + (err.message || err));
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>Assinatura Digital - Teste</h2>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 2 }}>
          <PDFViewer src="/template.pdf" />
        </div>
        <div style={{ width: 360 }}>
          <label>Nome:</label>
          <input style={{ width: '100%', padding: 8 }} onChange={e=> fieldsRef.current.nome = e.target.value} placeholder="Nome do assinante" />
          <div style={{ marginTop: 12 }}>
            <SignaturePad onChange={setSignatureDataUrl} />
          </div>
          <button style={{ marginTop: 12, padding: '8px 12px' }} onClick={handleAutoSign} disabled={!signatureDataUrl}>Assinar Automaticamente</button>
          <div style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{status}</div>
          {anchorInfo && <div style={{ marginTop:8 }}>Anchor: page {anchorInfo.pageIndex+1} x:{anchorInfo.x.toFixed(1)} y:{anchorInfo.y.toFixed(1)}</div>}
        </div>
      </div>
    </div>
  );
}