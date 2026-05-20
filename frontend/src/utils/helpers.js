/**
 * utils/helpers.js
 * Date helpers, priority/status constants, and color maps.
 */
import { format, isPast, isToday } from 'date-fns';

export const PRIORITIES = ['low', 'medium', 'high'];
export const STATUSES   = ['todo', 'in_progress', 'done'];

export const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };
export const STATUS_LABELS   = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

export function isOverdue(task) {
  if (!task.due_date || task.status === 'done') return false;
  return isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'MMM d, yyyy · h:mm a');
}

/** Extract field error messages from API validation errors */
export function getFieldError(fields, fieldName) {
  return fields?.find((f) => f.field === fieldName)?.message;
}

/** Get initials from a name string */
export function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}
