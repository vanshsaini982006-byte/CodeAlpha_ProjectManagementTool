const express = require('express');
const router = express.Router();
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/projectAccess');

router.use(protect);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', requireProjectMember, requireProjectAdmin, updateProject);
router.delete('/:id', requireProjectMember, deleteProject);
router.post('/:id/members', requireProjectMember, requireProjectAdmin, addMember);
router.delete('/:id/members/:userId', requireProjectMember, requireProjectAdmin, removeMember);

module.exports = router;
