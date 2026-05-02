import * as crypto from 'node:crypto';
import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

type LegacyReceiptRow = {
  id: number;
  file_url: string;
  receipt_number: string;
};

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    // Use raw ALTER for MySQL FK compatibility; changeColumn may rebuild table and fail.
    await queryInterface.sequelize.query(
      'ALTER TABLE receipts MODIFY lead_id INT UNSIGNED NULL',
    );

    await queryInterface.addColumn('receipts', 'user_id', {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('receipts', 'hash', {
      type: DataTypes.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn('receipts', 'p_hash', {
      type: DataTypes.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn('receipts', 'is_used', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    const [rows] = (await queryInterface.sequelize.query(
      'SELECT id, file_url, receipt_number FROM receipts',
    )) as [LegacyReceiptRow[], unknown];
    for (const row of rows) {
      const hash = crypto
        .createHash('sha256')
        .update(`${row.file_url}|${row.receipt_number}`)
        .digest('hex');
      await queryInterface.bulkUpdate('receipts', { hash }, { id: row.id });
    }

    await queryInterface.changeColumn('receipts', 'hash', {
      type: DataTypes.STRING(64),
      allowNull: false,
    });

    await queryInterface.addConstraint('receipts', {
      fields: ['hash'],
      type: 'unique',
      name: 'unique_receipt_hash',
    });
    await queryInterface.addIndex('receipts', ['user_id'], {
      name: 'receipts_user_id_idx',
    });
    await queryInterface.addIndex('receipts', ['p_hash'], {
      name: 'receipts_p_hash_idx',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeIndex('receipts', 'receipts_p_hash_idx');
    await queryInterface.removeIndex('receipts', 'receipts_user_id_idx');
    await queryInterface.removeConstraint('receipts', 'unique_receipt_hash');
    await queryInterface.removeColumn('receipts', 'is_used');
    await queryInterface.removeColumn('receipts', 'p_hash');
    await queryInterface.removeColumn('receipts', 'hash');
    await queryInterface.removeColumn('receipts', 'user_id');

    await queryInterface.sequelize.query(
      'ALTER TABLE receipts MODIFY lead_id INT UNSIGNED NOT NULL',
    );
  },
};
