const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { emitToProject, emitToUser } = require('../socket');
const { createNotification } = require('../services/notificationService');

// @desc    Get all projects the logged-in user belongs to
// @route   GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name username avatar')
      .populate('members.user', 'name username avatar email')
      .sort('-updatedAt');
    res.json({ success: true, projects });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a project
// @route   POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Owner' }],
    });

    const populated = await project.populate([
      { path: 'owner', select: 'name username avatar' },
      { path: 'members.user', select: 'name username avatar email' },
    ]);

    res.status(201).json({ success: true, project: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project (with dashboard stats)
// @route   GET /api/projects/:id
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name username avatar')
      .populate('members.user', 'name username avatar email');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isMember = project.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project' });
    }

    const tasks = await Task.find({ project: project._id });
    const now = new Date();
    const stats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'Completed').length,
      inProgress: tasks.filter((t) => t.status === 'In Progress').length,
      pending: tasks.filter((t) => !['Completed'].includes(t.status)).length,
      overdue: tasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== 'Completed').length,
    };

    res.json({ success: true, project, stats });
  } catch (err) {
    next(err);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const project = req.project; // set by requireProjectMember middleware

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;

    await project.save();
    const populated = await project.populate([
      { path: 'owner', select: 'name username avatar' },
      { path: 'members.user', select: 'name username avatar email' },
    ]);

    emitToProject(project._id, 'projectUpdated', populated);
    res.json({ success: true, project: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete project (owner only)
// @route   DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const project = req.project;

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project owner can delete this project' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    emitToProject(project._id, 'projectDeleted', { projectId: project._id });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Add/invite a member to a project
// @route   POST /api/projects/:id/members
const addMember = async (req, res, next) => {
  try {
    const { email, username, role = 'Member' } = req.body;
    const project = req.project;

    if (!email && !username) {
      return res.status(400).json({ success: false, message: 'Provide an email or username to invite' });
    }

    const user = await User.findOne(email ? { email: email.toLowerCase() } : { username: username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email/username' });
    }

    const alreadyMember = project.members.some((m) => m.user.toString() === user._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this project' });
    }

    project.members.push({ user: user._id, role: ['Owner', 'Admin', 'Member'].includes(role) ? role : 'Member' });
    await project.save();

    const populated = await project.populate([
      { path: 'owner', select: 'name username avatar' },
      { path: 'members.user', select: 'name username avatar email' },
    ]);

    await createNotification({
      recipient: user._id,
      sender: req.user._id,
      type: 'PROJECT_ADDED',
      message: `${req.user.name} added you to project "${project.name}"`,
      project: project._id,
    });

    emitToProject(project._id, 'memberAdded', { project: populated, addedUser: user.toSafeObject() });
    res.status(201).json({ success: true, project: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove a member from a project
// @route   DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res, next) => {
  try {
    const project = req.project;
    const { userId } = req.params;

    if (project.owner.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner' });
    }

    project.members = project.members.filter((m) => m.user.toString() !== userId);
    await project.save();

    const populated = await project.populate([
      { path: 'owner', select: 'name username avatar' },
      { path: 'members.user', select: 'name username avatar email' },
    ]);

    emitToProject(project._id, 'memberRemoved', { projectId: project._id, removedUserId: userId });
    res.json({ success: true, project: populated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
