import { Response, NextFunction } from 'express';
import { ColumnService } from '../services/column.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export class ColumnController {
  static async getColumns(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const columns = await ColumnService.getColumns(req.params.id);
      return sendSuccess(res, columns);
    } catch (err) {
      next(err);
    }
  }

  static async createColumn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const column = await ColumnService.createColumn(req.params.id, req.body.title);
      return sendSuccess(res, column, 'Column created successfully.', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateColumn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const column = await ColumnService.updateColumn(req.params.columnId, req.body);
      return sendSuccess(res, column, 'Column updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  static async deleteColumn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ColumnService.deleteColumn(req.params.columnId);
      return sendSuccess(res, result, 'Column deleted successfully.');
    } catch (err: any) {
      if (err.message.includes('Cannot delete a column')) {
        return sendError(res, err.message, 400);
      }
      next(err);
    }
  }
}
