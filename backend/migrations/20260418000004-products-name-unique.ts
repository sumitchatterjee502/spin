import type { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.addConstraint('products', {
      fields: ['name'],
      type: 'unique',
      name: 'products_name_unique',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeConstraint('products', 'products_name_unique');
  },
};
