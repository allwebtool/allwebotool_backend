import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
}) 
export class MyWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private clientRooms = new Map<string, Set<string>>(); // Map to store rooms per client

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove client from all rooms upon disconnect
    this.clientRooms.delete(client.id);
  }

  // Example of authenticating and joining a room based on user ID
  @SubscribeMessage('authenticate')
  async handleAuthentication(client: Socket, userId: string): Promise<void> {
    // Assuming you have a way to authenticate userId
    if (userId) {
      client.join(userId); // Join a room named after the userId
      if (!this.clientRooms.has(client.id)) {
        this.clientRooms.set(client.id, new Set<string>());
      }
      this.clientRooms.get(client.id).add(userId); // Store client's rooms
      console.log(`Client ${client.id} authenticated as user ${userId}`);
    } else {
      console.log(`Client ${client.id} failed authentication`);
    }
  }

  // Example of sending a notification to a specific user
  sendNotificationToUser(userId: string, payload: any): void {
    this.server.to(userId).emit('new_notification', payload);
  }

  // Example of broadcasting to all clients in a room
  sendBroadcastNotification(room: string, payload: any): void {
    this.server.to(room).emit('broadcast_notification', payload);
  }
}
