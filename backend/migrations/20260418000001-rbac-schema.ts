import type { ModelAttributeColumnOptions, QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

const uintPk = (): ModelAttributeColumnOptions => ({
  allowNull: false,
  autoIncrement: true,
  primaryKey: true,
  type: DataTypes.INTEGER.UNSIGNED,
});

const fkUser = {
  type: DataTypes.INTEGER.UNSIGNED,
  allowNull: false,
  references: { model: 'users', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
};

const fkRole = {
  type: DataTypes.INTEGER.UNSIGNED,
  allowNull: false,
  references: { model: 'roles', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
};

const fkPermission = {
  type: DataTypes.INTEGER.UNSIGNED,
  allowNull: false,
  references: { model: 'permissions', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
};

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('users', {
      id: uintPk(),
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal(
          'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ),
      },
    });

    await queryInterface.createTable('roles', {
      id: uintPk(),
      name: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal(
          'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ),
      },
    });

    await queryInterface.createTable('permissions', {
      id: uintPk(),
      permission_key: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal(
          'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ),
      },
    });

    await queryInterface.createTable('user_roles', {
      user_id: {
        ...fkUser,
        primaryKey: true,
      },
      role_id: {
        ...fkRole,
        primaryKey: true,
      },
    });

    await queryInterface.createTable('role_permissions', {
      role_id: {
        ...fkRole,
        primaryKey: true,
      },
      permission_id: {
        ...fkPermission,
        primaryKey: true,
      },
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('user_roles');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('users');
  },
};
