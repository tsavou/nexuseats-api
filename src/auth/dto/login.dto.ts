import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'marco@nexus.dev', description: 'L\'adresse email de l\'utilisateur' })
  @IsEmail({}, { message: 'L\'email doit être valide' })
  email: string;

  @ApiProperty({ example: 'secret123', description: 'Le mot de passe de l\'utilisateur' })
  @IsNotEmpty({ message: 'Le mot de passe ne doit pas être vide' })
  password: string;
}
