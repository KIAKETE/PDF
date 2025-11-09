import React, { useRef, useEffect } from 'react';
export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2,2);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  }, []);
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };
  const start = (e) => { drawing.current = true; last.current = getPos(e); };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last.current = pos;
  };
  const end = () => { drawing.current = false; const url = canvasRef.current.toDataURL('image/png'); if (onChange) onChange(url); };
  const clear = () => { const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); if (onChange) onChange(null); };
  return (
    <div>
      <div style={{ border: '1px solid #ccc', borderRadius: 6, overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: 150, touchAction: 'none' }}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        />
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button type="button" onClick={clear} className="px-3 py-1 border rounded">Limpar</button>
      </div>
    </div>
  );
}