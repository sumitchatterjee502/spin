import type { ModelAttributeColumnOptions, QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

const uintPk = (): ModelAttributeColumnOptions => ({
  allowNull: false,
  autoIncrement: true,
  primaryKey: true,
  type: DataTypes.INTEGER.UNSIGNED,
});

const fkCampaign = {
  type: DataTypes.INTEGER.UNSIGNED,
  allowNull: false,
  references: { model: 'campaigns', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
};

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('qr_mappings', {
      id: uintPk(),
      code: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      campaign_id: fkCampaign,
      redirect_url: {
        type: DataTypes.STRING(2048),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      expires_at: {
        type: DataTypes.DATE,
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

    await queryInterface.addIndex('qr_mappings', ['campaign_id'], {
      name: 'qr_mappings_campaign_id_idx',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('qr_mappings');
  },
};
