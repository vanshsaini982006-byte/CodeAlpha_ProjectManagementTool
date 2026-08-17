const Project = require('../models/Project');

// Ensures req.user is a member (any role) of the project. Attaches project + membership to req.
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const membership = project.members.find((m) => m.user.toString() === req.user._id.toString());

    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project' });
    }

    req.project = project;
    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

// Ensures req.membership role is Owner or Admin (call after requireProjectMember)
const requireProjectAdmin = (req, res, next) => {
  if (!req.membership || !['Owner', 'Admin'].includes(req.membership.role)) {
    return res.status(403).json({ success: false, message: 'Requires Owner or Admin role on this project' });
  }
  next();
};

module.exports = { requireProjectMember, requireProjectAdmin };
