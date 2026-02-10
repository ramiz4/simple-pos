import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { SsoModule } from './sso/sso.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SyncModule } from './sync/sync.module';
import { TenantMiddleware } from './tenants/tenant.middleware';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductsModule,
    CustomersModule,
    OrdersModule,
    SsoModule,
    EnterpriseModule,
    SyncModule,
    TenantsModule,
    SubscriptionsModule,
    AnalyticsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
