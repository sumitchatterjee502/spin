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

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('campaigns', {
      id: uintPk(),
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'INACTIVE',
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

    await queryInterface.createTable('products', {
      id: uintPk(),
      name: {
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

    await queryInterface.createTable('campaign_products', {
      id: uintPk(),
      campaign_id: fkCampaign,
      product_id: fkProduct,
    });

    await queryInterface.addConstraint('campaign_products', {
      fields: ['campaign_id', 'product_id'],
      type: 'unique',
      name: 'campaign_products_campaign_id_product_id_unique',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('campaign_products');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('campaigns');
  },
};
