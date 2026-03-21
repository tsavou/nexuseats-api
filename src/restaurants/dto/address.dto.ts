import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  IsISO31661Alpha2,
} from 'class-validator';

export class AddressDto {
  @ApiProperty({ description: 'Nom de la rue', example: '12 rue de la Paix' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'Ville', example: 'Paris' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Code postal', example: '75002' })
  @Matches(/^\d{5}$/, {
    message: 'Le code postal doit être composé de 5 chiffres',
  })
  zipCode: string;

  @ApiProperty({ description: 'Code pays ISO-3166-1 alpha-2', example: 'FR' })
  @IsISO31661Alpha2({
    message: 'Le format du pays doit être un code ISO-3166-1 alpha-2 (ex: FR)',
  })
  country: string;
}
