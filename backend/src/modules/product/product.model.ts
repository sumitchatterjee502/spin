import {
  AutoIncrement,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Campaign, CampaignProduct } from '../campaign/campaign.model';

@Table({ tableName: 'products', underscored: true })
export class Product extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  declare name: string;

  @BelongsToMany(() => Campaign, () => CampaignProduct)
  declare campaigns?: Campaign[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
