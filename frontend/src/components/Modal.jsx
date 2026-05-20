/**
 * components/Modal.jsx
 * Minimalist Monochrome Modal.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal texture-grid" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h2 className="text-4xl" style={{ fontFamily: 'var(--font-serif)', marginBottom: 16 }}>{title}</h2>
            <div className="rule-thick" style={{ width: 80 }}></div>
          </div>
          <button className="btn btn-ghost" style={{ padding: 8 }} onClick={onClose} title="Close">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, lineHeight: 0.5 }}>×</span>
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>,
    document.getElementById('root')
  );
}
