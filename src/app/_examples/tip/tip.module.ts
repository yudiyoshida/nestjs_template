import { Module } from '@nestjs/common';
import { AuthenticationGuardsModule } from '../../authentication/application/guards/guards.module';
import { TipPersistenceModule } from './application/persistence/tip-persistence.module';
import { CreateLocalTip } from './application/usecases/create-local-tip/create-local-tip.service';
import { CreateWeatherTip } from './application/usecases/create-weather-tip/create-weather-tip.service';
import { DeleteTip } from './application/usecases/delete-tip/delete-tip.service';
import { EditTip } from './application/usecases/edit-tip/edit-tip.service';
import { ExpireTips } from './application/usecases/expire-tips/expire-tips.service';
import { FindAllTip } from './application/usecases/find-all-tip/find-all-tip.service';
import { FindTipById } from './application/usecases/find-tip-by-id/find-tip-by-id.service';
import { TipAdminController } from './infra/drivers/http/admin/tip-admin.controller';
import { TipUserController } from './infra/drivers/http/user/tip-user.controller';

@Module({
  imports: [
    TipPersistenceModule,
    AuthenticationGuardsModule,
  ],
  controllers: [
    TipAdminController,
    TipUserController,
  ],
  providers: [
    CreateLocalTip,
    CreateWeatherTip,
    DeleteTip,
    EditTip,
    ExpireTips,
    FindAllTip,
    FindTipById,
  ],
})
export class TipModule {}
