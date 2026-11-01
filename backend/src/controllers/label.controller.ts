import { Response, NextFunction } from 'express';
import { LabelService } from '../services/label.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export class LabelController {
  static async getLabels(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const labels = await LabelService.getLabels(req.params.id);
      return sendSuccess(res, labels);
    } catch (err) {
      next(err);
    }
  }

  static async createLabel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, color } = req.body;
      const label = await LabelService.createLabel(req.params.id, name, color);
      return sendSuccess(res, label, 'Label created successfully.', 201);
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        return sendError(res, err.message, 409);
      }
      next(err);
    }
  }

  static async deleteLabel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await LabelService.deleteLabel(req.params.labelId);
      return sendSuccess(res, null, 'Label deleted successfully.');
    } catch (err) {
      next(err);
    }
  }
}
