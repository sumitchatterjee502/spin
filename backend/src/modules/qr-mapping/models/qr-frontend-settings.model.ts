import {
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

export const QR_FRONTEND_SETTINGS_ROW_ID = 1;

@Table({ tableName: 'qr_frontend_settings', underscored: true })
export class QrFrontendSettings extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER.UNSIGNED)
  declare id: number;

  @Column({ type: DataType.STRING(2048), allowNull: true })
  declare frontendBaseUrl: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
