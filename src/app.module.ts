import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { BlockListenerModule } from './block-listener/block-listener.module';
import config from './config/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    BlockListenerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
