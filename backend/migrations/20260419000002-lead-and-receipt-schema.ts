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
    await queryInterface.createTable('leads', {
      id: uintPk(),
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(320),
        allowNull: false,
      },
      shop_location: {
        type: DataTypes.STRING(255),
        allowNull: false,
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

    await queryInterface.addIndex('leads', ['phone'], {
      name: 'leads_phone_idx',
    });
    await queryInterface.addIndex('leads', ['email'], {
      name: 'leads_email_idx',
    });

    await queryInterface.createTable('receipts', {
      id: uintPk(),
      lead_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'leads', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      file_url: {
        type: DataTypes.STRING(2048),
        allowNull: false,
      },
      receipt_number: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      file_type: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('receipts', {
      fields: ['receipt_number'],
      type: 'unique',
      name: 'receipts_receipt_number_unique',
    });
    await queryInterface.addIndex('receipts', ['lead_id'], {
      name: 'receipts_lead_id_idx',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('receipts');
    await queryInterface.dropTable('leads');
  },
};
