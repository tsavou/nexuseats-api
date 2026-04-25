import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  VERSION_NEUTRAL,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller({
  path: 'auth',
  version: VERSION_NEUTRAL,
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: "Inscription d'un nouvel utilisateur",
    description:
      'Crée un compte utilisateur avec email/mot de passe et retourne un token JWT. ' +
      "Le rôle par défaut est 'customer'. Les rôles autorisés sont 'customer' et 'owner'.",
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès, retourne le JWT.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Données invalides (email mal formé, mot de passe trop court).',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 400,
          message: [
            "L'email doit être valide",
            'Le mot de passe doit contenir au moins 8 caractères',
          ],
          error: 'Bad Request',
          timestamp: '2026-03-22T14:30:00.000Z',
          path: '/api/auth/register',
          requestId: 'c3a5e7f2-1234-4abc-9def-567890abcdef',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "L'email est déjà utilisé.",
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 409,
          message: 'Un enregistrement avec cette valeur de email existe déjà',
          error: 'Conflict',
          timestamp: '2026-03-22T14:30:00.000Z',
          path: '/api/auth/register',
          requestId: 'c3a5e7f2-1234-4abc-9def-567890abcdef',
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Trop de requêtes — rate limiting actif.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle({
    short: {
      ttl: 1000,
      limit: 3,
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Connexion d'un utilisateur",
    description:
      'Authentifie un utilisateur par email/mot de passe et retourne un token JWT. ' +
      'Ce endpoint est limité à 3 requêtes par seconde (rate limiting renforcé).',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie, retourne le JWT.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides (email mal formé, mot de passe vide).',
  })
  @ApiResponse({
    status: 401,
    description: 'Identifiants invalides (email ou mot de passe incorrect).',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 401,
          message: 'Email ou mot de passe invalide',
          error: 'Unauthorized',
          timestamp: '2026-03-22T14:30:00.000Z',
          path: '/api/auth/login',
          requestId: 'c3a5e7f2-1234-4abc-9def-567890abcdef',
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Trop de requêtes — 3 tentatives max par seconde.',
    schema: {
      example: {
        statusCode: 429,
        message: 'ThrottlerException: Too Many Requests',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Récupérer le profil de l'utilisateur connecté",
    description:
      'Retourne les informations du profil utilisateur associé au token JWT fourni. ' +
      'Nécessite un token valide dans le header Authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Le profil utilisateur.',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        email: 'marco@nexus.dev',
        role: 'owner',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé (Token manquant ou invalide).',
    schema: {
      example: {
        success: false,
        error: {
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
          timestamp: '2026-03-22T14:30:00.000Z',
          path: '/api/auth/profile',
          requestId: 'c3a5e7f2-1234-4abc-9def-567890abcdef',
        },
      },
    },
  })
  getProfile(@Request() req: any) {
    return req.user;
  }
}
