/**
 * pages/KanbanPage.jsx
 * Drag-and-drop Kanban board using @dnd-kit.
 * Dragging a card across columns immediately calls the API to update status.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { tasksAPI, projectsAPI } from '../api';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import { formatDate, isOverdue } from '../utils/helpers';
import { Kanban, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: '#94a3b8' },
  { id: 'in_progress', label: 'In Progress', color: 'var(--info)' },
  { id: 'done',        label: 'Done',         color: 'var(--success)' },
];

function KanbanCard({ task, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const overdue = isOverdue(task);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="kanban-card" style={{ borderColor: overdue ? 'rgba(239,68,68,0.3)' : undefined }}>
        <div className={`priority-strip ${task.priority}`} />
        <div style={{ paddingLeft: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>{task.title}</div>
          {task.description && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
              {task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <PriorityBadge priority={task.priority} />
            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: overdue ? 'var(--danger)' : 'var(--text-muted)', alignItems: 'center' }}>
              {task.assignee_name && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <User size={11} /> {task.assignee_name.split(' ')[0]}
                </span>
              )}
              {task.due_date && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {overdue ? '⚠' : <Calendar size={11} />} {formatDate(task.due_date)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ column, tasks, activeId }) {
  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: column.color }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{column.label}</span>
        </div>
        <span style={{ fontSize: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 999, padding: '2px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-muted)', fontSize: 13, border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
            Drop tasks here
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} isDragging={activeId === task.id} />
          ))
        )}
      </SortableContext>
    </div>
  );
}

export default function KanbanPage() {
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
  const findColumn = (taskId) => {
    const task = tasks.find((t) => t.id === Number(taskId));
    return task?.status;
  };

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over) return;

    const task       = tasks.find((t) => t.id === active.id);
    const newStatus  = COLUMNS.find((c) => c.id === over.id)?.id  // dropped on column
                    || tasks.find((t) => t.id === over.id)?.status; // dropped on card

    if (!task || !newStatus || task.status === newStatus) return;

    // Optimistically update UI
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      await tasksAPI.update(task.id, { status: newStatus });
      toast.success(`Moved to "${COLUMNS.find((c) => c.id === newStatus)?.label}"`);
    } catch {
      // Rollback on failure
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
      toast.error('Failed to update task');
    }
  };

  const activeTask = tasks.find((t) => t.id === activeId);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Kanban size={22} color="var(--accent-light)" />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Kanban Board</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Drag and drop tasks to update their status</p>
        </div>
        <select className="input" style={{ width: 220 }} value={selProject} onChange={(e) => setSelProject(e.target.value)}>
          <option value="">Select a project…</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {!selProject ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <Kanban size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: 'var(--text-muted)' }}>Select a project to view its Kanban board</p>
        </div>
      ) : loading ? (
        <div className="kanban-board">
          {COLUMNS.map((c) => <div key={c.id} className="skeleton" style={{ height: 400 }} />)}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {COLUMNS.map((col) => (
              <KanbanColumn key={col.id} column={col} tasks={tasksByColumn(col.id)} activeId={activeId} />
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <div className="kanban-card" style={{ opacity: 0.95, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', cursor: 'grabbing', paddingLeft: 22 }}>
                <div className={`priority-strip ${activeTask.priority}`} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{activeTask.title}</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
