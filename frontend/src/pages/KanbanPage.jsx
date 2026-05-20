/**
 * pages/KanbanPage.jsx
 * Minimalist Monochrome Kanban board.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { tasksAPI, projectsAPI } from '../api';
import { formatDate, isOverdue } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const COLUMNS = [
  { id: 'todo',        label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done',        label: 'Done' },
];

function KanbanCard({ task, isDragging, user }) {
  const isDragDisabled = user?.role === 'member' && task.assignee_id !== user?.id;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    disabled: isDragDisabled,
  });

  const overdue = isOverdue(task);
  const cardClassName = `kanban-card ${overdue ? 'overdue' : ''}`;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragDisabled ? 'not-allowed' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className={cardClassName} style={{ borderLeftWidth: task.priority === 'high' ? '8px' : '2px', borderLeftColor: 'var(--foreground)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {task.priority} Priority
          </div>
          {isDragDisabled && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4 }}>
              🔒 READ-ONLY
            </div>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
          {task.title}
          {overdue && (
            <span style={{ color: '#E11D48', fontSize: 12, fontWeight: 700, marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              ⚠️ OVERDUE
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: 16, marginTop: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase' }}>
            <div>{task.assignee_name || 'UNASSIGNED'}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: overdue ? 700 : 400, color: overdue ? '#E11D48' : 'inherit' }}>
            {task.due_date ? formatDate(task.due_date) : 'NO DUE DATE'}
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ column, tasks, activeId, user }) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div ref={setNodeRef} className="kanban-column texture-diagonal">
      <div className="kanban-column-header">
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 24 }}>{column.label}.</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>
          {String(tasks.length).padStart(2, '0')}
        </span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--muted-foreground)' }}>
            Empty column
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} isDragging={activeId === task.id} user={user} />
          ))
        )}
      </SortableContext>
    </div>
  );
}

export default function KanbanPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  const [tasks,    setTasks]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [selProject, setSelProject] = useState(projectId || '');
  const [loading,  setLoading]  = useState(true);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchTasks = useCallback(async () => {
    if (!selProject) { setTasks([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await tasksAPI.listByProject(selProject);
      setTasks(res.data.tasks);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [selProject]);

  useEffect(() => {
    projectsAPI.list().then((r) => {
      setProjects(r.data.projects);
      if (!selProject && r.data.projects.length > 0) setSelProject(String(r.data.projects[0].id));
    });
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const tasksByColumn = (colId) => tasks.filter((t) => t.status === colId);

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over) return;

    const task       = tasks.find((t) => t.id === active.id);
    const newStatus  = COLUMNS.find((c) => c.id === over.id)?.id 
                    || tasks.find((t) => t.id === over.id)?.status;

    if (!task || !newStatus || task.status === newStatus) return;

    // Enforce role permission checks on drag end
    const isDragDisabled = user?.role === 'member' && task.assignee_id !== user?.id;
    if (isDragDisabled) {
      toast.error('You can only update status for your assigned tasks');
      return;
    }

    // Optimistic UI update
    const oldStatus = task.status;
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      await tasksAPI.update(task.id, { status: newStatus });
      toast.success('Task status updated');
    } catch (err) {
      // Rollback optimistic update
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: oldStatus } : t));
      const errMsg = err.response?.data?.message || 'Failed to update status';
      toast.error(errMsg);
    }
  };

  const activeTask = tasks.find((t) => t.id === activeId);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 64, flexWrap: 'wrap', gap: 32 }}>
        <div>
          <h1 className="text-8xl" style={{ fontFamily: 'var(--font-serif)', marginBottom: 16 }}>
            Kanban.
          </h1>
          <div className="rule-thick" style={{ width: 160, marginBottom: 16 }}></div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Workflow Visualization
          </p>
        </div>
        <select className="input" style={{ width: 300, border: '2px solid var(--border)' }} value={selProject} onChange={(e) => setSelProject(e.target.value)}>
          <option value="">Select a project…</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {!selProject ? (
        <div className="card texture-grid" style={{ padding: 120, textAlign: 'center', border: '4px solid var(--border)' }}>
          <h3 className="text-5xl" style={{ fontFamily: 'var(--font-serif)', marginBottom: 16 }}>Select Project</h3>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontStyle: 'italic', color: 'var(--muted-foreground)' }}>
            Choose an initiative to visualize.
          </p>
        </div>
      ) : loading ? (
        <div className="kanban-board">
          {COLUMNS.map((c) => <div key={c.id} className="skeleton" style={{ height: 600 }} />)}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {COLUMNS.map((col) => (
              <KanbanColumn key={col.id} column={col} tasks={tasksByColumn(col.id)} activeId={activeId} user={user} />
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <div className={`kanban-card dragging ${isOverdue(activeTask) ? 'overdue' : ''}`} style={{ borderLeftWidth: activeTask.priority === 'high' ? '8px' : '2px', borderLeftColor: 'var(--foreground)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  {activeTask.priority} Priority
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
                  {activeTask.title}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
