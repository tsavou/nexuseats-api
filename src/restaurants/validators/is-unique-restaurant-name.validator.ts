import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueRestaurantNameConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(name: string) {
    if (!name) return true; // on laisse @IsNotEmpty gérer si c'est vide

    const restaurant = await this.prisma.restaurant.findFirst({
      where: { name },
    });

    // Si le restaurant existe déjà, le nom n'est pas unique → retourne false
    return !restaurant;
  }

  defaultMessage() {
    return 'Le nom du restaurant "$value" existe déjà.';
  }
}

export function IsUniqueRestaurantName(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueRestaurantNameConstraint,
    });
  };
}
