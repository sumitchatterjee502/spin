import type { ModelAttributeColumnOptions, QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

const uintPk = (): ModelAttributeColumnOptions => ({
  allowNull: false,
  autoIncrement: true,
  primaryKey: true,
  type: DataTypes.INTEGER.UNSIGNED,
});

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('participations', {
      id: uintPk(),
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      campaign_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'campaigns', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'WON', 'LOST'),
        allowNull: false,
        defaultValue: 'PENDING',
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

    await queryInterface.addIndex('participations', ['campaign_id'], {
      name: 'participations_campaign_id_idx',
    });
    await queryInterface.addIndex('participations', ['product_id'], {
      name: 'participations_product_id_idx',
    });
    await queryInterface.addIndex('participations', ['user_id'], {
      name: 'participations_user_id_idx',
    });

    await queryInterface.createTable('spin_results', {
      id: uintPk(),
      participation_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'participations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      result: {
        type: DataTypes.ENUM('WIN', 'LOSE'),
        allowNull: false,
      },
      prize_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'prizes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addConstraint('spin_results', {
      fields: ['participation_id'],
      type: 'unique',
      name: 'spin_results_participation_id_unique',
    });
    await queryInterface.addIndex('spin_results', ['prize_id'], {
      name: 'spin_results_prize_id_idx',
    });
    await queryInterface.addIndex('spin_results', ['created_at'], {
      name: 'spin_results_created_at_idx',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('spin_results');
    await queryInterface.dropTable('participations');
  },
};
