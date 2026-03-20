import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Matches, Max, Min } from 'class-validator';

export class OpeningHourDto {
  @ApiProperty({ example: 1, description: 'Jour de la semaine (0 = Dimanche, 1 = Lundi, etc.)' })
  @IsNumber()
  @Min(0)
  @Max(6)
  day: number;

  @ApiProperty({ example: '09:00', description: 'Heure d\'ouverture' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Format HH:mm attendu (ex: 09:00)' })
  openTime: string;

  @ApiProperty({ example: '14:00', description: 'Heure de fermeture' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Format HH:mm attendu (ex: 14:00)' })
  closeTime: string;
}
