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

const fkProduct = {
  type: DataTypes.INTEGER.UNSIGNED,
  allowNull: false,
  references: { model: 'products', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
};

const fkPrize = {
  type: DataTypes.INTEGER.UNSIGNED,
  allowNull: false,
  references: { model: 'prizes', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
};

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('prizes', {
      id: uintPk(),
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
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

    await queryInterface.createTable('prize_configs', {
      id: uintPk(),
      campaign_id: { ...fkCampaign, unique: true },
      max_per_day: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      max_per_user: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      total_limit: {
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

    await queryInterface.createTable('prize_mappings', {
      id: uintPk(),
      campaign_id: fkCampaign,
      product_id: fkProduct,
      prize_id: fkPrize,
    });

    await queryInterface.addConstraint('prize_mappings', {
      fields: ['campaign_id', 'product_id'],
      type: 'unique',
      name: 'prize_mappings_campaign_id_product_id_unique',
    });

    await queryInterface.createTable('prize_inventories', {
      id: uintPk(),
      campaign_id: fkCampaign,
      prize_id: fkPrize,
      stock: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
    });

    await queryInterface.addConstraint('prize_inventories', {
      fields: ['campaign_id', 'prize_id'],
      type: 'unique',
      name: 'prize_inventories_campaign_id_prize_id_unique',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('prize_inventories');
    await queryInterface.dropTable('prize_mappings');
    await queryInterface.dropTable('prize_configs');
    await queryInterface.dropTable('prizes');
  },
};
