import { Request } from 'express';
import { JwtPayload } from '../utils/jwt';

export interface AuthenticatedUser extends JwtPayload {
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  projectRole?: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
