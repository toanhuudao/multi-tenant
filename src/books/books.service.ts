import { Inject } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TenantService } from '../tenant/tenant-sercice.decorator';

import { TENANT_CONNECTION } from '../tenant/tenant.module';
import { Book } from './book.entity';

@TenantService()
export class BooksService {
  constructor(@Inject(TENANT_CONNECTION) private dataSource: DataSource) {}

  async findAll() {
    const firstBook = await this.dataSource
      .getRepository(Book)
      .createQueryBuilder('book')
      .where('book.id = :id', { id: 1 })
      .getOne();

    return firstBook;
  }
}
