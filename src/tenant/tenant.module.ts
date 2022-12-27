import {
  BadRequestException,
  MiddlewareConsumer,
  Module,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection, createConnection, getConnection } from 'typeorm';
import { Book } from '../books/book.entity';
import { DataSource } from 'typeorm';

import { Tenant } from './tenant.entity';

export const TENANT_CONNECTION = 'TENANT_CONNECTION';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  providers: [
    {
      provide: TENANT_CONNECTION,
      inject: [REQUEST, DataSource],
      // scope: Scope.REQUEST,
      useFactory: async (request, dataSource) => {
        const tenant: Tenant = await dataSource
          .getRepository(Tenant)
          .findOne({ where: { host: request.headers.host } });
        return new DataSource({
          name: tenant.name,
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'root',
          password: '123456aA@',
          database: tenant.name,
          entities: [Book],
          synchronize: true,
        });
      },
    },
  ],
  exports: [TENANT_CONNECTION],
})
export class TenantModule {
  constructor(private readonly connection: DataSource) {}

  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(async (req, res, next) => {
        console.log(req.headers.host);

        const tenant: Tenant = await this.connection
          .getRepository(Tenant)
          .findOne({ where: { host: req.headers.host } });

        if (!tenant) {
          throw new BadRequestException(
            'Database Connection Error',
            'There is a Error with the Database!',
          );
        }

        try {
          getConnection(tenant.name);
          next();
        } catch (e) {
          const createdConnection: Connection = await createConnection({
            name: tenant.name,
            type: 'mysql',
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: '123456aA@',
            database: tenant.name,
            entities: [Book],
            synchronize: true,
          });

          if (createdConnection) {
            next();
          } else {
            throw new BadRequestException(
              'Database Connection Error',
              'There is a Error with the Database!',
            );
          }
        }
      })
      .forRoutes('*');
  }
}
