import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderTop: '1px solid var(--border-color)',
      marginTop: '8px',
    }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        Showing {from}–{to} of {total}
      </span>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{
            background: 'none',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
            padding: '6px 10px',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <FiChevronLeft />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                style={{
                  background: p === page ? 'var(--accent-cyan)' : 'none',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: p === page ? '#fff' : 'var(--text-primary)',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  minWidth: '32px',
                  fontWeight: p === page ? 600 : 400,
                }}
              >
                {p}
              </button>
            )
          )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{
            background: 'none',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
            padding: '6px 10px',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}
