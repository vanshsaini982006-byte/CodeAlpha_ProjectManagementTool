const express = require('express');
const router = express.Router();
const { getComments, addComment, updateComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/tasks/:taskId/comments', getComments);
router.post('/tasks/:taskId/comments', addComment);
router.put('/comments/:id', updateComment);
router.delete('/comments/:id', deleteComment);

module.exports = router;
