import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, UniqueConstraintError, WhereOptions } from 'sequelize';
import { CampaignProduct } from '../campaign/campaign.model';
import type { CreateProductDto } from './dto/create-product.dto';
import type { ListProductsQueryDto } from './dto/list-products-query.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.model';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
    @InjectModel(CampaignProduct)
    private readonly campaignProductModel: typeof CampaignProduct,
  ) {}

  private toPublicRow(p: Product): { id: number; name: string } {
    return { id: p.id, name: p.name };
  }

  async createProduct(
    dto: CreateProductDto,
  ): Promise<{ message: string; responseData: { id: number; name: string } }> {
    if (!dto.name.trim()) {
      throw new BadRequestException('name is required');
    }
    try {
      const row = await this.productModel.create({ name: dto.name.trim() });
      return {
        message: 'Product created successfully',
        responseData: this.toPublicRow(row),
      };
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException('A product with this name already exists');
      }
      throw err;
    }
  }

  async getAllProducts(query?: ListProductsQueryDto): Promise<{
    message: string;
    responseData: Array<{ id: number; name: string }>;
  }> {
    const where: WhereOptions<Product> = {};
    if (query?.search?.trim()) {
      const term = query.search.trim().replace(/[%_\\]/g, '');
      if (term.length > 0) {
        where.name = { [Op.like]: `%${term}%` };
      }
    }
    const rows = await this.productModel.findAll({
      where,
      order: [['id', 'ASC']],
    });
    return {
      message: 'Products retrieved successfully',
      responseData: rows.map((p) => this.toPublicRow(p)),
    };
  }

  async getProductById(id: number): Promise<{
    message: string;
    responseData: { id: number; name: string };
  }> {
    const row = await this.productModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Product not found');
    }
    return {
      message: 'Product retrieved successfully',
      responseData: this.toPublicRow(row),
    };
  }

  async updateProduct(
    id: number,
    dto: UpdateProductDto,
  ): Promise<{ message: string; responseData: { id: number; name: string } }> {
    const row = await this.productModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Product not found');
    }
    if (dto.name === undefined) {
      throw new BadRequestException('No fields provided to update');
    }
    if (!dto.name.trim()) {
      throw new BadRequestException('name cannot be empty');
    }
    try {
      await row.update({ name: dto.name.trim() });
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException('A product with this name already exists');
      }
      throw err;
    }
    return {
      message: 'Product updated successfully',
      responseData: this.toPublicRow(row),
    };
  }

  async deleteProduct(
    id: number,
  ): Promise<{ message: string; responseData: null }> {
    const row = await this.productModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Product not found');
    }
    const links = await this.campaignProductModel.count({
      where: { productId: id },
    });
    if (links > 0) {
      throw new ConflictException(
        'Product is linked to a campaign and cannot be deleted',
      );
    }
    await row.destroy();
    return {
      message: 'Product deleted successfully',
      responseData: null,
    };
  }
}
