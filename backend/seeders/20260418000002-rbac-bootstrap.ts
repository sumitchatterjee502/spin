import type { QueryInterface } from 'sequelize';
import bcrypt from 'bcrypt';

/** Keep aligned with `src/modules/rbac/constants/permission-keys.ts` */
const ALL_PERMISSION_KEYS = [
  'rbac:manage',
  'campaign:read',
  'campaign:write',
  'campaign:delete',
  'product:read',
  'product:write',
  'participation:read',
  'spin:execute',
  'fraud:review',
  'verification:verify',
  'fulfillment:process',
  'notification:send',
] as const;

const ROLE_ADMIN = 'admin';
const ROLE_OPERATOR = 'operator';
const ROLE_PARTICIPANT = 'participant';

const ADMIN_ROLE_ID = 1;
const OPERATOR_ROLE_ID = 2;
const PARTICIPANT_ROLE_ID = 3;
const SEED_ADMIN_USER_ID = 1;

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    const now = new Date();

    const permissionRows = ALL_PERMISSION_KEYS.map((key, index) => ({
      id: index + 1,
      permission_key: key,
      description: key,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert('permissions', permissionRows);

    await queryInterface.bulkInsert('roles', [
      {
        id: ADMIN_ROLE_ID,
        name: ROLE_ADMIN,
        description: 'Full platform access',
        created_at: now,
        updated_at: now,
      },
      {
        id: OPERATOR_ROLE_ID,
        name: ROLE_OPERATOR,
        description: 'Operational access without RBAC admin',
        created_at: now,
        updated_at: now,
      },
      {
        id: PARTICIPANT_ROLE_ID,
        name: ROLE_PARTICIPANT,
        description: 'Default self-service participant',
        created_at: now,
        updated_at: now,
      },
    ]);

    const permIdByKey = new Map<string, number>();
    for (const row of permissionRows) {
      permIdByKey.set(row.permission_key, row.id);
    }

    const allPermIds = ALL_PERMISSION_KEYS.map((k) => permIdByKey.get(k)!);

    const operatorKeys = [
      'campaign:read',
      'campaign:write',
      'campaign:delete',
      'product:read',
      'product:write',
      'participation:read',
      'spin:execute',
      'fraud:review',
      'verification:verify',
      'fulfillment:process',
      'notification:send',
    ];
    const operatorPermIds = operatorKeys.map((k) => permIdByKey.get(k)!);

    const participantKeys = [
      'campaign:read',
      'product:read',
      'participation:read',
      'spin:execute',
    ];
    const participantPermIds = participantKeys.map((k) => permIdByKey.get(k)!);

    const rolePermRows = (roleId: number, permIds: number[]) =>
      permIds.map((permission_id) => ({
        role_id: roleId,
        permission_id,
      }));

    await queryInterface.bulkInsert('role_permissions', [
      ...rolePermRows(ADMIN_ROLE_ID, allPermIds),
      ...rolePermRows(OPERATOR_ROLE_ID, operatorPermIds),
      ...rolePermRows(PARTICIPANT_ROLE_ID, participantPermIds),
    ]);

    const adminEmail =
      process.env.SEED_ADMIN_EMAIL?.toLowerCase() ?? 'admin@example.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!123';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await queryInterface.bulkInsert('users', [
      {
        id: SEED_ADMIN_USER_ID,
        email: adminEmail,
        password_hash: passwordHash,
        first_name: 'Admin',
        last_name: 'User',
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('user_roles', [
      { user_id: SEED_ADMIN_USER_ID, role_id: ADMIN_ROLE_ID },
    ]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete('user_roles', {}, {});
    await queryInterface.bulkDelete('role_permissions', {}, {});
    await queryInterface.bulkDelete('permissions', {}, {});
    await queryInterface.bulkDelete('roles', {}, {});
    await queryInterface.bulkDelete('users', {}, {});
  },
};
