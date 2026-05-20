/**
 * components/Badge.jsx
 * Status and priority badges with consistent colour coding.
 */
export function StatusBadge({ status }) {
  const map = {
    todo:        'badge badge-todo',
    in_progress: 'badge badge-in-progress',
    done:        'badge badge-done',
  };
  const label = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
  return <span className={map[status] || 'badge'}>{label[status] || status}</span>;
}

export function PriorityBadge({ priority }) {
  const map = {
    low:    'badge badge-low',
    medium: 'badge badge-medium',
    high:   'badge badge-high',
  };
  return (
    <span className={map[priority] || 'badge'} style={{ textTransform: 'capitalize' }}>
      {priority}
    </span>
  );
}
