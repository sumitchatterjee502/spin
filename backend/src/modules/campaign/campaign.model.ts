import {
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Product } from '../product/product.model';
import { CampaignStatus } from './campaign-status.enum';

@Table({ tableName: 'campaigns', underscored: true })
export class Campaign extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  declare name: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare startDate: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare endDate: Date;

  @Column({
    type: DataType.ENUM(...Object.values(CampaignStatus)),
    allowNull: false,
  })
  declare status: CampaignStatus;

  @BelongsToMany(() => Product, () => CampaignProduct)
  declare products?: Product[];

  @HasMany(() => CampaignProduct)
  declare campaignProducts?: CampaignProduct[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}

@Table({ tableName: 'campaign_products', underscored: true, timestamps: false })
export class CampaignProduct extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @ForeignKey(() => Campaign)
  @Column(DataType.INTEGER.UNSIGNED)
  declare campaignId: number;

  @ForeignKey(() => Product)
  @Column(DataType.INTEGER.UNSIGNED)
  declare productId: number;

  @BelongsTo(() => Campaign)
  declare campaign?: Campaign;

  @BelongsTo(() => Product)
  declare product?: Product;
}
