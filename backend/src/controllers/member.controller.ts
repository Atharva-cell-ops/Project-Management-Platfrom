import { Response, NextFunction } from 'express';
import { MemberService } from '../services/member.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export class MemberController {
  static async getMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const members = await MemberService.getMembers(req.params.id);
      return sendSuccess(res, members);
    } catch (err) {
      next(err);
    }
  }

  static async addMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const operatorId = req.user?.userId;
      if (!operatorId) return sendError(res, 'Unauthorized', 401);

      const member = await MemberService.addMember(
        req.params.id,
        operatorId,
        req.body.email,
        req.body.role
      );
      return sendSuccess(res, member, 'Member added successfully.', 201);
    } catch (err: any) {
      if (err.message.includes('No user found') || err.message.includes('already a member')) {
        return sendError(res, err.message, 400);
      }
      next(err);
    }
  }

  static async updateMemberRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const operatorId = req.user?.userId;
      if (!operatorId) return sendError(res, 'Unauthorized', 401);

      const updated = await MemberService.updateMemberRole(
        req.params.id,
        operatorId,
        req.params.userId,
        req.body.role
      );
      return sendSuccess(res, updated, 'Member role updated successfully.');
    } catch (err: any) {
      if (err.message.includes('Cannot change the role')) {
        return sendError(res, err.message, 400);
      }
      next(err);
    }
  }

  static async removeMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const operatorId = req.user?.userId;
      if (!operatorId) return sendError(res, 'Unauthorized', 401);

      const result = await MemberService.removeMember(
        req.params.id,
        operatorId,
        req.params.userId
      );
      return sendSuccess(res, result, 'Member removed successfully.');
    } catch (err: any) {
      if (err.message.includes('Cannot remove the project owner') || err.message.includes('not found')) {
        return sendError(res, err.message, 400);
      }
      next(err);
    }
  }
}
