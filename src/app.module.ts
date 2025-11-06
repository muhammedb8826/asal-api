import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PricingModule } from './pricing/pricing.module';
import { CategoryModule } from './category/category.module';
import { UomModule } from './uom/uom.module';
import { CustomerModule } from './customer/customer.module';
import { UnitCategoryModule } from './unit-category/unit-category.module';
import { ProductModule } from './product/product.module';
import { SupplierModule } from './supplier/supplier.module';
import { PurchaseModule } from './purchase/purchase.module';
import { GrnModule } from './grn/grn.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNCHRONIZE === 'true' || true,
      logging: process.env.DB_LOGGING === 'true' || false,
    }),
    AuthModule,
    PricingModule,
    CategoryModule,
    UomModule,
    CustomerModule,
    UnitCategoryModule,
    ProductModule,
    SupplierModule,
    PurchaseModule,
    GrnModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
