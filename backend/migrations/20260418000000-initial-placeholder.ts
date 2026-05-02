import type { QueryInterface } from 'sequelize';

/**
 * Placeholder migration so `sequelize-cli db:migrate` validates your pipeline.
 * Replace with real schema migrations as the platform evolves.
 */
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query('SELECT 1');
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query('SELECT 1');
  },
};
