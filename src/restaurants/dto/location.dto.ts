import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from './address.dto';
import { CoordinatesDto } from './coordinates.dto';

/**
 * DTO de localisation enrichie pour la v2.
 *
 * Regroupe l'adresse complète (réutilise AddressDto) et les coordonnées GPS
 * dans un objet unique `location`.
 */
export class LocationDto {
  @ApiProperty({
    description: 'Adresse complète du restaurant',
    type: () => AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({
    description: 'Coordonnées GPS du restaurant',
    type: () => CoordinatesDto,
  })
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;
}
