import { PartialType } from '@nestjs/mapped-types';
import { CreateRestaurantDto } from './create-restaurant.dto';

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