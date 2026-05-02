import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

const TABLE_NAME = 'participations';
const INVOICE_UNIQUE_NAME = 'participations_invoice_number_unique';
const VERIFIED_AT_INDEX = 'participations_verified_at_idx';
const STATUS_INDEX = 'participations_status_idx';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    const table = await queryInterface.describeTable(TABLE_NAME);

    // Expand status lifecycle to support verification outcomes.
    await queryInterface.sequelize.query(
      "ALTER TABLE participations MODIFY status ENUM('PENDING', 'WON', 'LOST', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING'",
    );

    if (!table.invoice_number) {
      await queryInterface.addColumn(TABLE_NAME, 'invoice_number', {
        type: DataTypes.STRING(128),
        allowNull: true,
      });
    }

    if (!table.remarks) {
      await queryInterface.addColumn(TABLE_NAME, 'remarks', {
        type: DataTypes.TEXT,
        allowNull: true,
      });
    }

    if (!table.verified_at) {
      await queryInterface.addColumn(TABLE_NAME, 'verified_at', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }

    await queryInterface.addConstraint(TABLE_NAME, {
      fields: ['invoice_number'],
      type: 'unique',
      name: INVOICE_UNIQUE_NAME,
    });

    await queryInterface.addIndex(TABLE_NAME, ['verified_at'], {
      name: VERIFIED_AT_INDEX,
    });
    await queryInterface.addIndex(TABLE_NAME, ['status'], {
      name: STATUS_INDEX,
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeIndex(TABLE_NAME, STATUS_INDEX);
    await queryInterface.removeIndex(TABLE_NAME, VERIFIED_AT_INDEX);
    await queryInterface.removeConstraint(TABLE_NAME, INVOICE_UNIQUE_NAME);

    await queryInterface.removeColumn(TABLE_NAME, 'verified_at');
    await queryInterface.removeColumn(TABLE_NAME, 'remarks');
    await queryInterface.removeColumn(TABLE_NAME, 'invoice_number');

    // Map newer statuses back before restoring original enum domain.
    await queryInterface.sequelize.query(
      "UPDATE participations SET status = 'WON' WHERE status IN ('VERIFIED', 'REJECTED')",
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE participations MODIFY status ENUM('PENDING', 'WON', 'LOST') NOT NULL DEFAULT 'PENDING'",
    );
  },
};
