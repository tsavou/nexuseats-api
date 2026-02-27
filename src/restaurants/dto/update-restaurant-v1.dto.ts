import { PartialType } from '@nestjs/swagger';
import { CreateRestaurantDto } from './create-restaurant-v1.dto';

// PartialType rend TOUS les champs optionnels
// Parfait pour PATCH (modification partielle)
export class UpdateRestaurantDto extends PartialType(CreateRestaurantDto) {}

// Équivalent à :
// export class UpdateRestaurantDto {
//   @IsOptional() @IsString() name?: string;
//   @IsOptional() @IsEnum(Cuisine) cuisine?: Cuisine;
//   @IsOptional() @IsString() address?: string;
//   ...
// }