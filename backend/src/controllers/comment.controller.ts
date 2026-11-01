import { Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export class CommentController {
  static async getComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const comments = await CommentService.getComments(req.params.id);
      return sendSuccess(res, comments);
    } catch (err) {
      next(err);
    }
  }

  static async createComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 'Unauthorized', 401);

      const comment = await CommentService.createComment(
        req.params.id,
        userId,
        req.body.content
      );
      return sendSuccess(res, comment, 'Comment added successfully.', 201);
    } catch (err) {
      next(err);
    }
  }

  static async deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 'Unauthorized', 401);

      const result = await CommentService.deleteComment(req.params.commentId, userId);
      return sendSuccess(res, result, 'Comment deleted successfully.');
    } catch (err: any) {
      if (err.message.includes('only delete your own')) {
        return sendError(res, err.message, 403);
      }
      next(err);
    }
  }
}
