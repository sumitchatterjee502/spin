import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Campaign } from '../../campaign/campaign.model';
import { Product } from '../../product/product.model';
import { Prize } from './prize.model';

@Table({ tableName: 'prize_mappings', underscored: true, timestamps: false })
export class PrizeMapping extends Model {
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

  @ForeignKey(() => Prize)
  @Column(DataType.INTEGER.UNSIGNED)
  declare prizeId: number;

  @BelongsTo(() => Campaign)
  declare campaign?: Campaign;

  @BelongsTo(() => Product)
  declare product?: Product;

  @BelongsTo(() => Prize)
  declare prize?: Prize;
}
