/**
 * components/Badge.jsx
 * Minimalist Monochrome badges.
 */
export function StatusBadge({ status }) {
  const labels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  };

  const isDone = status === 'done';

  return (
    <span className={`badge ${isDone ? 'badge-inverted' : ''}`}>
      {labels[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const isHigh = priority === 'high';

  return (
    <span className="badge" style={{ 
      borderWidth: isHigh ? '3px' : '1px', 
      fontWeight: isHigh ? 800 : 600,
      borderColor: 'var(--foreground)'
    }}>
      {priority}
    </span>
  );
}
