import {
  Body,
  Controller,
  Get,
  GatewayTimeoutException,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { OrdersGatewayService } from './orders-gateway.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('orders')
@Controller({
  path: 'orders',
  version: VERSION_NEUTRAL,
})
export class OrdersGatewayController {
  constructor(private readonly ordersGatewayService: OrdersGatewayService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une commande',
    description:
      'Transmet la création de commande au Orders Service via RabbitMQ.',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Commande créée avec succès.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 504,
    description: 'Orders Service indisponible ou timeout RabbitMQ.',
  })
  async create(@Body() dto: CreateOrderDto) {
    try {
      return await this.ordersGatewayService.createOrder(dto);
    } catch (error) {
      this.handleGatewayError(error);
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les commandes',
    description:
      'Récupère la liste des commandes depuis le Orders Service via RabbitMQ.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des commandes récupérée avec succès.',
    type: OrderResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 504,
    description: 'Orders Service indisponible ou timeout RabbitMQ.',
  })
  async findAll() {
    try {
      return await this.ordersGatewayService.getOrders();
    } catch (error) {
      this.handleGatewayError(error);
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une commande par ID',
    description:
      'Récupère une commande spécifique depuis le Orders Service via RabbitMQ.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la commande',
    example: '5b38d57c-d57e-4949-b3c8-4cbfca3143a6',
  })
  @ApiResponse({
    status: 200,
    description: 'Commande trouvée.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Commande introuvable.',
  })
  @ApiResponse({
    status: 504,
    description: 'Orders Service indisponible ou timeout RabbitMQ.',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.ordersGatewayService.getOrderById(id);
    } catch (error) {
      this.handleGatewayError(error);
    }
  }

  private handleGatewayError(error: unknown): never {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new GatewayTimeoutException('Orders Service unavailable');
    }

    throw error;
  }
}
