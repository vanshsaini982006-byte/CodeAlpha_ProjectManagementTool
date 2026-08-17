const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  assignTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/projectAccess');

router.use(protect);

// Nested under projects
router.get('/projects/:projectId/tasks', requireProjectMember, getTasks);
router.post('/projects/:projectId/tasks', requireProjectMember, createTask);

// Direct task routes
router.get('/tasks/:id', getTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);
router.put('/tasks/:id/status', updateTaskStatus);
router.put('/tasks/:id/assign', assignTask);

module.exports = router;
