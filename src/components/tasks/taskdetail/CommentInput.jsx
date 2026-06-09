import { Send } from 'lucide-react';

export default function CommentInput({ value, onChange, onSubmit, sending }) {
  return (
    <>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Añade un comentario... (Ctrl+Enter para enviar)"
        rows={2}
        onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) onSubmit(); }}
        className="w-full rounded-xl px-4 py-3 text-sm border resize-none focus:outline-none transition-colors"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text)' }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      {value.trim() && (
        <button
          onClick={onSubmit}
          disabled={sending}
          className="mt-2 flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
          style={{ background: 'var(--primary)' }}
        >
          <Send size={11} />
          {sending ? 'Enviando...' : 'Comentar'}
        </button>
      )}
    </>
  );
}
