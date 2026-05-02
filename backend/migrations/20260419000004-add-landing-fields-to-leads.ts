import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.addColumn('leads', 'address', {
      type: DataTypes.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('leads', 'campaign_id', {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'campaigns', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
    await queryInterface.addColumn('leads', 'qr_mapping_id', {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'qr_mappings', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    await queryInterface.addIndex('leads', ['campaign_id'], {
      name: 'leads_campaign_id_idx',
    });
    await queryInterface.addIndex('leads', ['qr_mapping_id'], {
      name: 'leads_qr_mapping_id_idx',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeColumn('leads', 'qr_mapping_id');
    await queryInterface.removeColumn('leads', 'campaign_id');
    await queryInterface.removeColumn('leads', 'address');
  },
};
