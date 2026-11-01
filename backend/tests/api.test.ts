import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('FLOWBOARD Backend API & RBAC Test Suite', () => {
  let authToken = '';
  let memberToken = '';
  let createdProjectId = '';
  let createdColumnId = '';
  let createdTaskId = '';

  const testUser = {
    name: 'Test Engineer',
    email: `test-${Date.now()}@flowboard.dev`,
    password: 'Password123!',
  };

  const secondUser = {
    name: 'Member User',
    email: `member-${Date.now()}@flowboard.dev`,
    password: 'Password123!',
  };

  beforeAll(async () => {
    // Register test user
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    authToken = res.body.data.token;

    // Register second user
    const memberRes = await request(app).post('/api/auth/register').send(secondUser);
    expect(memberRes.status).toBe(201);
    memberToken = memberRes.body.data.token;
  });

  describe('1. Health and Authentication APIs', () => {
    it('GET /api/health should return 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('POST /api/auth/login should authenticate user with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('POST /api/auth/login should reject invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/me should return current user profile with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('GET /api/auth/me should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('2. Project Lifecycle and RBAC Verification', () => {
    it('POST /api/projects should create project and default columns', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Integration Test Project',
          description: 'Automated test suite workspace',
          key: 'ITP',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.columns.length).toBe(4); // To Do, In Progress, In Review, Done
      createdProjectId = res.body.data.id;
      createdColumnId = res.body.data.columns[0].id;
    });

    it('GET /api/projects/:id should retrieve project workspace details', async () => {
      const res = await request(app)
        .get(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Integration Test Project');
    });

    it('GET /api/projects/:id should block unauthorized user from accessing private project', async () => {
      const res = await request(app)
        .get(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });

    it('POST /api/projects/:id/members should allow OWNER to invite a member', async () => {
      const res = await request(app)
        .post(`/api/projects/${createdProjectId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: secondUser.email,
          role: 'MEMBER',
        });

      expect(res.status).toBe(201);
    });

    it('GET /api/projects/:id should now allow invited member to access project', async () => {
      const res = await request(app)
        .get(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('3. Task Management, Drag-and-Drop & Comments', () => {
    it('POST /api/projects/:id/tasks should create task card in column', async () => {
      const res = await request(app)
        .post(`/api/projects/${createdProjectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          columnId: createdColumnId,
          title: 'Write comprehensive integration tests',
          description: 'Ensure all critical user flows are covered',
          priority: 'HIGH',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Write comprehensive integration tests');
      expect(res.body.data.priority).toBe('HIGH');
      createdTaskId = res.body.data.id;
    });

    it('PATCH /api/tasks/:id/move should move task and update order', async () => {
      const projectRes = await request(app)
        .get(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const targetColId = projectRes.body.data.columns[1].id; // "In Progress"

      const res = await request(app)
        .patch(`/api/tasks/${createdTaskId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetColumnId: targetColId,
          newOrder: 0,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.columnId).toBe(targetColId);
    });

    it('POST /api/tasks/:id/comments should add a comment to task', async () => {
      const res = await request(app)
        .post(`/api/tasks/${createdTaskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test comment from test suite',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('Test comment from test suite');
    });

    it('GET /api/projects/:id/dashboard should calculate summary metrics', async () => {
      const res = await request(app)
        .get(`/api/projects/${createdProjectId}/dashboard`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics.totalTasks).toBeGreaterThanOrEqual(1);
    });
  });
});
