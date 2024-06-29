import { Module } from '@nestjs/common';
import { MyWebSocketGateway } from './websocket.gateway';

@Module({
  providers: [MyWebSocketGateway],
})
export class WebSocketModule {}
