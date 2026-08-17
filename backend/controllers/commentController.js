const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { emitToProject } = require('../socket');
const { createNotification } = require('../services/notificationService');

// Helper: verify user has access to a task's project
const getTaskWithAccess = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  const project = await Project.findById(task.project);
  const isMember = project.members.some((m) => m.user.toString() === userId.toString());
  if (!isMember) {
    const err = new Error('You do not have access to this task');
    err.statusCode = 403;
    throw err;
  }
  return { task, project };
};

// @desc    Get comments for a task
// @route   GET /api/tasks/:taskId/comments
const getComments = async (req, res, next) => {
  try {
    await getTaskWithAccess(req.params.taskId, req.user._id);
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('user', 'name username avatar')
      .sort('createdAt');
    res.json({ success: true, comments });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:taskId/comments
const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const { task, project } = await getTaskWithAccess(req.params.taskId, req.user._id);

    const comment = await Comment.create({ task: task._id, user: req.user._id, content });
    task.comments.push(comment._id);
    await task.save();

    const populated = await comment.populate('user', 'name username avatar');

    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: task.assignedTo,
        sender: req.user._id,
        type: 'TASK_COMMENT',
        message: `${req.user.name} commented on task "${task.title}"`,
        project: project._id,
        task: task._id,
      });
    }

    emitToProject(project._id, 'commentAdded', { taskId: task._id, comment: populated });
    res.status(201).json({ success: true, comment: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Edit own comment
// @route   PUT /api/comments/:id
const updateComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own comments' });
    }

    comment.content = content;
    await comment.save();
    const populated = await comment.populate('user', 'name username avatar');

    const task = await Task.findById(comment.task);
    emitToProject(task.project, 'commentUpdated', { taskId: task._id, comment: populated });
    res.json({ success: true, comment: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete own comment
// @route   DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
    }

    const task = await Task.findById(comment.task);
    await comment.deleteOne();
    if (task) {
      task.comments = task.comments.filter((c) => c.toString() !== comment._id.toString());
      await task.save();
      emitToProject(task.project, 'commentDeleted', { taskId: task._id, commentId: comment._id });
    }

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, addComment, updateComment, deleteComment };
