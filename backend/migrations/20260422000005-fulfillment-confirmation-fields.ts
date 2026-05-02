import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

const TABLE = 'participations';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    const table = await queryInterface.describeTable(TABLE);

    await queryInterface.sequelize.query(
      "ALTER TABLE participations MODIFY status ENUM('PENDING','WON','LOST','APPROVED','VERIFIED','CONFIRMED','PROCESSING','DISPATCHED','DELIVERED','REJECTED') NOT NULL DEFAULT 'PENDING'",
    );

    if (!table.address) {
      await queryInterface.addColumn(TABLE, 'address', {
        type: DataTypes.STRING(512),
        allowNull: true,
      });
    }
    if (!table.confirmed_at) {
      await queryInterface.addColumn(TABLE, 'confirmed_at', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }
    if (!table.dispatch_date) {
      await queryInterface.addColumn(TABLE, 'dispatch_date', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }
    if (!table.delivery_date) {
      await queryInterface.addColumn(TABLE, 'delivery_date', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }
    if (!table.is_locked) {
      await queryInterface.addColumn(TABLE, 'is_locked', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex(TABLE, ['status'], {
      name: 'participations_status_idx_v2',
    });
    await queryInterface.addIndex(TABLE, ['confirmed_at'], {
      name: 'participations_confirmed_at_idx',
    });
    await queryInterface.addIndex(TABLE, ['updated_at'], {
      name: 'participations_updated_at_idx_v2',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeIndex(TABLE, 'participations_updated_at_idx_v2');
    await queryInterface.removeIndex(TABLE, 'participations_confirmed_at_idx');
    await queryInterface.removeIndex(TABLE, 'participations_status_idx_v2');

    await queryInterface.removeColumn(TABLE, 'is_locked');
    await queryInterface.removeColumn(TABLE, 'delivery_date');
    await queryInterface.removeColumn(TABLE, 'dispatch_date');
    await queryInterface.removeColumn(TABLE, 'confirmed_at');
    await queryInterface.removeColumn(TABLE, 'address');

    await queryInterface.sequelize.query(
      "UPDATE participations SET status = 'APPROVED' WHERE status = 'CONFIRMED'",
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE participations MODIFY status ENUM('PENDING','WON','LOST','APPROVED','VERIFIED','PROCESSING','DISPATCHED','DELIVERED','REJECTED') NOT NULL DEFAULT 'PENDING'",
    );
  },
};
