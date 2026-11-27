import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { getServerUser, requirePermission } from '../server-auth';

vi.mock('@/auth', () => ({ auth: vi.fn() }));

const authMock = auth as unknown as Mock;

describe('lib/server-auth', () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it('returns null when the Auth.js session has no user', async () => {
    authMock.mockResolvedValue({ user: null });

    await expect(getServerUser()).resolves.toBeNull();
  });

  it('normalizes the user from the Auth.js session', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 1,
        email: 'a@b.com',
        first_name: 'Ada',
        last_name: 'Lovelace',
      },
    });

    await expect(getServerUser()).resolves.toMatchObject({
      id: '1',
      email: 'a@b.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  });

  it('requires an authenticated user before checking permissions', async () => {
    authMock.mockResolvedValue({ user: null });

    await expect(requirePermission('admin')).rejects.toMatchObject({ status: 401 });
  });

  it('returns 403 when the authenticated user lacks a permission', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 1,
        email: 'user@example.com',
        permissions: ['view'],
        roles: [{ slug: 'user', permissions: [{ slug: 'view' }] }],
      },
    });

    await expect(requirePermission('edit')).rejects.toMatchObject({ status: 403 });
  });

  it('allows a superuser regardless of the requested permission', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 1,
        email: 'admin@example.com',
        is_superuser: true,
        roles: [],
        permissions: [],
      },
    });

    await expect(requirePermission('edit')).resolves.toMatchObject({
      id: '1',
      is_superuser: true,
    });
  });
});
