import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDatabase, TEST_PASSWORD } from './test-app';

const validPatient = {
  firstName: 'Grace',
  lastName: 'Hopper',
  email: 'grace.hopper@example.com',
  phoneNumber: '+1 (555) 987-6543',
  dob: '1906-12-09',
};

describe('Patients API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

  async function login(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: TEST_PASSWORD })
      .expect(200);
    expect(res.body.user.email).toBe(email);
    expect(res.headers['set-cookie']).toBeDefined();
    return res.body.token as string;
  }

  beforeAll(async () => {
    await resetDatabase();
    app = await createTestApp();
    adminToken = await login('admin@demo.com');
    userToken = await login('user@demo.com');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('auth', () => {
    it('rejects invalid credentials with 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@demo.com', password: 'wrong' })
        .expect(401);
    });

    it('rejects a malformed login payload with 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: '' })
        .expect(400);
    });

    it('returns the current user from /auth/me', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toMatchObject({ email: 'admin@demo.com', role: 'admin' });
    });
  });

  describe('authorization', () => {
    it('returns 401 when listing patients without a token', async () => {
      await request(app.getHttpServer()).get('/patients').expect(401);
    });

    it('allows a user (view-only) to list patients', async () => {
      const res = await request(app.getHttpServer())
        .get('/patients?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(res.body).toMatchObject({ page: 1, limit: 5 });
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('forbids a user from creating a patient (403)', async () => {
      await request(app.getHttpServer())
        .post('/patients')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPatient)
        .expect(403);
    });
  });

  describe('admin CRUD', () => {
    let createdId: string;

    it('creates a patient (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/patients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPatient)
        .expect(201);
      expect(res.body).toMatchObject({ email: validPatient.email, dob: validPatient.dob });
      expect(res.body.id).toBeDefined();
      createdId = res.body.id;
    });

    it('rejects an invalid create payload (400)', async () => {
      await request(app.getHttpServer())
        .post('/patients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPatient, email: 'bad', dob: '3000-01-01' })
        .expect(400);
    });

    it('fetches the patient by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/patients/${createdId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(res.body.id).toBe(createdId);
    });

    it('updates the patient (200)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/patients/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPatient, lastName: 'Hopper-Murray' })
        .expect(200);
      expect(res.body.lastName).toBe('Hopper-Murray');
    });

    it('returns 404 for a missing patient', async () => {
      await request(app.getHttpServer())
        .get('/patients/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('deletes the patient (200, { ok: true })', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/patients/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toEqual({ ok: true });
    });
  });
});
