const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Project = require('../models/Project');
const { emitToProject } = require('../socket');
const { createNotification } = require('../services/notificationService');

const populateTask = (query) =>
  query
    .populate('assignedTo', 'name username avatar')
    .populate('createdBy', 'name username avatar')
    .populate('project', 'name');

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
const getTasks = async (req, res, next) => {
  try {
    const tasks = await populateTask(Task.find({ project: req.params.projectId })).sort('order createdAt');
    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a task in a project
// @route   POST /api/projects/:projectId/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, labels, assignedTo } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const project = req.project;

    if (assignedTo) {
      const isMember = project.members.some((m) => m.user.toString() === assignedTo);
      if (!isMember) {
        return res.status(400).json({ success: false, message: 'Assignee must be a project member' });
      }
    }

    const task = await Task.create({
      title,
      description,
      project: project._id,
      status: status || 'Backlog',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      labels: labels || [],
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
    });

    const populated = await populateTask(Task.findById(task._id));

    if (assignedTo) {
      await createNotification({
        recipient: assignedTo,
        sender: req.user._id,
        type: 'TASK_ASSIGNED',
        message: `${req.user.name} assigned you a task: "${title}"`,
        project: project._id,
        task: task._id,
      });
    }

    emitToProject(project._id, 'taskCreated', populated);
    res.status(201).json({ success: true, task: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single task with comments
// @route   GET /api/tasks/:id
const getTask = async (req, res, next) => {
  try {
    const task = await populateTask(Task.findById(req.params.id));
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const isMember = project.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You do not have access to this task' });
    }

    const comments = await Comment.find({ task: task._id })
      .populate('user', 'name username avatar')
      .sort('createdAt');

    res.json({ success: true, task, comments });
  } catch (err) {
    next(err);
  }
};

// Helper: load task + verify project membership, attach to req
const loadTaskWithAccess = async (req) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  const project = await Project.findById(task.project);
  const membership = project.members.find((m) => m.user.toString() === req.user._id.toString());
  if (!membership) {
    const err = new Error('You do not have access to this task');
    err.statusCode = 403;
    throw err;
  }
  return { task, project, membership };
};

// @desc    Update task (title/description/priority/dueDate/labels)
// @route   PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const { task, project } = await loadTaskWithAccess(req);
    const { title, description, priority, dueDate, labels, status, assignedTo } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (labels !== undefined) task.labels = labels;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;

    await task.save();
    const populated = await populateTask(Task.findById(task._id));

    emitToProject(project._id, 'taskUpdated', populated);
    res.json({ success: true, task: populated });
  } catch (err) {
    next(err.statusCode ? Object.assign(err) : err);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const { task, project } = await loadTaskWithAccess(req);
    await Comment.deleteMany({ task: task._id });
    await task.deleteOne();

    emitToProject(project._id, 'taskDeleted', { taskId: task._id, projectId: project._id });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task status (drag-and-drop column move)
// @route   PUT /api/tasks/:id/status
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, order } = req.body;
    const validStatuses = ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const { task, project } = await loadTaskWithAccess(req);
    const oldStatus = task.status;
    task.status = status;
    if (order !== undefined) task.order = order;
    await task.save();

    const populated = await populateTask(Task.findById(task._id));

    if (task.assignedTo && oldStatus !== status) {
      await createNotification({
        recipient: task.assignedTo,
        sender: req.user._id,
        type: 'TASK_STATUS_CHANGED',
        message: `Task "${task.title}" moved from ${oldStatus} to ${status}`,
        project: project._id,
        task: task._id,
      });
    }

    emitToProject(project._id, 'taskMoved', populated);
    res.json({ success: true, task: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign task to a member
// @route   PUT /api/tasks/:id/assign
const assignTask = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    const { task, project } = await loadTaskWithAccess(req);

    if (assignedTo) {
      const isMember = project.members.some((m) => m.user.toString() === assignedTo);
      if (!isMember) {
        return res.status(400).json({ success: false, message: 'Assignee must be a project member' });
      }
    }

    task.assignedTo = assignedTo || null;
    await task.save();
    const populated = await populateTask(Task.findById(task._id));

    if (assignedTo) {
      await createNotification({
        recipient: assignedTo,
        sender: req.user._id,
        type: 'TASK_ASSIGNED',
        message: `${req.user.name} assigned you a task: "${task.title}"`,
        project: project._id,
        task: task._id,
      });
    }

    emitToProject(project._id, 'taskAssigned', populated);
    res.json({ success: true, task: populated });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask, updateTaskStatus, assignTask };
