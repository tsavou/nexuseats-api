import { IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'marco@nexus.dev', description: 'L\'adresse email de l\'utilisateur' })
  @IsEmail({}, { message: 'L\'email doit être valide' })
  email: string;

  @ApiProperty({ example: 'secret123', description: 'Le mot de passe de l\'utilisateur (min 8 caractères)' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password: string;
}
