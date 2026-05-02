import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CampaignProduct } from '../campaign/campaign.model';
import { ProductController } from './product.controller';
import { Product } from './product.model';
import { ProductService } from './product.service';

@Module({
  imports: [SequelizeModule.forFeature([Product, CampaignProduct])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [SequelizeModule, ProductService],
})
export class ProductModule {}
