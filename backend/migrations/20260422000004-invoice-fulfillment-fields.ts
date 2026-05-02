import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

const TABLE = 'participations';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    const table = await queryInterface.describeTable(TABLE);

    await queryInterface.sequelize.query(
      "ALTER TABLE participations MODIFY status ENUM('PENDING','WON','LOST','APPROVED','VERIFIED','PROCESSING','DISPATCHED','DELIVERED','REJECTED') NOT NULL DEFAULT 'PENDING'",
    );

    if (!table.fulfillment_status) {
      await queryInterface.addColumn(TABLE, 'fulfillment_status', {
        type: DataTypes.ENUM('APPROVED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'),
        allowNull: true,
      });
    }
    if (!table.tracking_id) {
      await queryInterface.addColumn(TABLE, 'tracking_id', {
        type: DataTypes.STRING(128),
        allowNull: true,
      });
    }
    if (!table.delivery_partner) {
      await queryInterface.addColumn(TABLE, 'delivery_partner', {
        type: DataTypes.STRING(128),
        allowNull: true,
      });
    }
    if (!table.updated_at) {
      await queryInterface.addColumn(TABLE, 'updated_at', {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal(
          'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ),
      });
    }

    await queryInterface.addIndex(TABLE, ['updated_at'], {
      name: 'participations_updated_at_idx',
    });
    await queryInterface.addIndex(TABLE, ['fulfillment_status'], {
      name: 'participations_fulfillment_status_idx',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeIndex(TABLE, 'participations_fulfillment_status_idx');
    await queryInterface.removeIndex(TABLE, 'participations_updated_at_idx');

    await queryInterface.removeColumn(TABLE, 'delivery_partner');
    await queryInterface.removeColumn(TABLE, 'tracking_id');
    await queryInterface.removeColumn(TABLE, 'fulfillment_status');

    await queryInterface.sequelize.query(
      "UPDATE participations SET status = 'APPROVED' WHERE status IN ('PROCESSING','DISPATCHED','DELIVERED')",
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE participations MODIFY status ENUM('PENDING','WON','LOST','APPROVED','VERIFIED','REJECTED') NOT NULL DEFAULT 'PENDING'",
    );
  },
};
