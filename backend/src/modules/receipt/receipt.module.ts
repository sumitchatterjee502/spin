import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Receipt } from '../lead/models/receipt.model';
import { User } from '../rbac/entities/user.entity';
import { HashService } from './hash.service';
import { ReceiptController } from './receipt.controller';
import { ReceiptService } from './receipt.service';

@Module({
  imports: [SequelizeModule.forFeature([Receipt, User])],
  controllers: [ReceiptController],
  providers: [ReceiptService, HashService],
  exports: [ReceiptService, HashService],
})
export class ReceiptModule {}
