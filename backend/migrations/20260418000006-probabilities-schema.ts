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
  onDelete: 'CASCADE',
};

const fkPrizeNullable = {
  type: DataTypes.INTEGER.UNSIGNED,
  allowNull: true,
  references: { model: 'prizes', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
};

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('probabilities', {
      id: uintPk(),
      campaign_id: fkCampaign,
      prize_id: fkPrizeNullable,
      weight: {
        type: DataTypes.INTEGER.UNSIGNED,
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

    await queryInterface.addIndex('probabilities', ['campaign_id'], {
      name: 'probabilities_campaign_id_idx',
    });

    await queryInterface.addConstraint('probabilities', {
      fields: ['campaign_id', 'prize_id'],
      type: 'unique',
      name: 'probabilities_campaign_id_prize_id_unique',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('probabilities');
  },
};
