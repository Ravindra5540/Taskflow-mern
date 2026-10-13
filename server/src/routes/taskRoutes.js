import { Router } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
const priorities = ['low', 'medium', 'high'];
const statuses = ['todo', 'in-progress', 'completed'];
const editableFields = ['title', 'description', 'priority', 'status', 'dueDate'];

router.use(requireAuth);

function validDueDate(value) {
  return value === null || (typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value)));
}

function validateTaskInput(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Task data must be an object.';

  if (!partial || Object.hasOwn(input, 'title')) {
    if (typeof input.title !== 'string' || input.title.trim().length < 1 || input.title.trim().length > 120) {
      return 'Title must be between 1 and 120 characters.';
    }
  }
  if (Object.hasOwn(input, 'description') && (typeof input.description !== 'string' || input.description.length > 2000)) {
    return 'Description must be 2000 characters or fewer.';
  }
  if (Object.hasOwn(input, 'priority') && !priorities.includes(input.priority)) {
    return 'Priority must be low, medium, or high.';
  }
  if (Object.hasOwn(input, 'status') && !statuses.includes(input.status)) {
    return 'Status must be todo, in-progress, or completed.';
  }
  if (Object.hasOwn(input, 'dueDate') && !validDueDate(input.dueDate)) {
    return 'Due date must be a valid date or null.';
  }
  return null;
}

function editableValues(input) {
  return Object.fromEntries(editableFields
    .filter((field) => Object.hasOwn(input, field))
    .map((field) => [field, field === 'dueDate' && input[field] ? new Date(input[field]) : input[field]]));
}

router.get('/', async (request, response, next) => {
  try {
    const { status, priority, q } = request.query;
    if (status && !statuses.includes(status)) {
      return response.status(400).json({ message: 'Invalid task status filter.' });
    }
    if (priority && !priorities.includes(priority)) {
      return response.status(400).json({ message: 'Invalid task priority filter.' });
    }

    const filter = { user: request.userId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (typeof q === 'string' && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ title: { $regex: escaped, $options: 'i' } }, { description: { $regex: escaped, $options: 'i' } }];
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    return response.json({ tasks });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (request, response, next) => {
  const validationMessage = validateTaskInput(request.body);
  if (validationMessage) return response.status(400).json({ message: validationMessage });

  try {
    const task = await Task.create({ ...editableValues(request.body), user: request.userId });
    return response.status(201).json({ task });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (request, response, next) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(404).json({ message: 'Task not found.' });
  }
  try {
    const task = await Task.findOne({ _id: request.params.id, user: request.userId });
    if (!task) return response.status(404).json({ message: 'Task not found.' });
    return response.json({ task });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', async (request, response, next) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(404).json({ message: 'Task not found.' });
  }
  const validationMessage = validateTaskInput(request.body, { partial: true });
  if (validationMessage) return response.status(400).json({ message: validationMessage });
  const values = editableValues(request.body);
  if (Object.keys(values).length === 0) {
    return response.status(400).json({ message: 'Provide at least one task field to update.' });
  }

  try {
    const task = await Task.findOneAndUpdate(
      { _id: request.params.id, user: request.userId },
      { $set: values },
      { new: true, runValidators: true },
    );
    if (!task) return response.status(404).json({ message: 'Task not found.' });
    return response.json({ task });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (request, response, next) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(404).json({ message: 'Task not found.' });
  }
  try {
    const task = await Task.findOneAndDelete({ _id: request.params.id, user: request.userId });
    if (!task) return response.status(404).json({ message: 'Task not found.' });
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
