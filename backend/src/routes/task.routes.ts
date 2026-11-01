import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { CommentController } from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  updateTaskSchema,
  moveTaskSchema,
  createCommentSchema,
} from '../schemas/task.schema';

const router = Router();

// Apply authentication to all task routes
router.use(authenticate);

// Task CRUD
router.get('/:id', TaskController.getTaskById);
router.patch('/:id', validate(updateTaskSchema), TaskController.updateTask);
router.patch('/:id/move', validate(moveTaskSchema), TaskController.moveTask);
router.delete('/:id', TaskController.deleteTask);

// Assignees
router.post('/:id/assignees', TaskController.assignUser);
router.delete('/:id/assignees/:userId', TaskController.unassignUser);

// Labels
router.post('/:id/labels', TaskController.attachLabel);
router.delete('/:id/labels/:labelId', TaskController.detachLabel);

// Comments
router.get('/:id/comments', CommentController.getComments);
router.post('/:id/comments', validate(createCommentSchema), CommentController.createComment);
router.delete('/comments/:commentId', CommentController.deleteComment);

export default router;
