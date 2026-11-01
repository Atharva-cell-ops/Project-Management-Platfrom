import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { MemberController } from '../controllers/member.controller';
import { ColumnController } from '../controllers/column.controller';
import { TaskController } from '../controllers/task.controller';
import { LabelController } from '../controllers/label.controller';
import { ActivityController } from '../controllers/activity.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireProjectRole } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} from '../schemas/project.schema';
import {
  createColumnSchema,
  updateColumnSchema,
  createTaskSchema,
  createLabelSchema,
} from '../schemas/task.schema';

const router = Router();

// Apply authentication to all project routes
router.use(authenticate);

// Project operations
router.get('/', ProjectController.getProjects);
router.post('/', validate(createProjectSchema), ProjectController.createProject);
router.get('/:id', requireProjectRole('MEMBER'), ProjectController.getProjectById);
router.patch('/:id', requireProjectRole('ADMIN'), validate(updateProjectSchema), ProjectController.updateProject);
router.delete('/:id', requireProjectRole('OWNER'), ProjectController.deleteProject);
router.get('/:id/dashboard', requireProjectRole('MEMBER'), ProjectController.getDashboard);

// Member operations
router.get('/:id/members', requireProjectRole('MEMBER'), MemberController.getMembers);
router.post('/:id/members', requireProjectRole('ADMIN'), validate(addMemberSchema), MemberController.addMember);
router.patch('/:id/members/:userId', requireProjectRole('OWNER'), validate(updateMemberRoleSchema), MemberController.updateMemberRole);
router.delete('/:id/members/:userId', requireProjectRole('ADMIN'), MemberController.removeMember);

// Column operations
router.get('/:id/columns', requireProjectRole('MEMBER'), ColumnController.getColumns);
router.post('/:id/columns', requireProjectRole('ADMIN'), validate(createColumnSchema), ColumnController.createColumn);
router.patch('/:id/columns/:columnId', requireProjectRole('ADMIN'), validate(updateColumnSchema), ColumnController.updateColumn);
router.delete('/:id/columns/:columnId', requireProjectRole('ADMIN'), ColumnController.deleteColumn);

// Task operations on project
router.get('/:id/tasks', requireProjectRole('MEMBER'), TaskController.getTasks);
router.post('/:id/tasks', requireProjectRole('MEMBER'), validate(createTaskSchema), TaskController.createTask);

// Label operations
router.get('/:id/labels', requireProjectRole('MEMBER'), LabelController.getLabels);
router.post('/:id/labels', requireProjectRole('MEMBER'), validate(createLabelSchema), LabelController.createLabel);
router.delete('/:id/labels/:labelId', requireProjectRole('ADMIN'), LabelController.deleteLabel);

// Activity audit trail
router.get('/:id/activities', requireProjectRole('MEMBER'), ActivityController.getProjectActivities);

export default router;
