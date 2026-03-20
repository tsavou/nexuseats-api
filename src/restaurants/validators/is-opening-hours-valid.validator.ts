import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

interface OpeningHour {
  day: number;
  openTime: string; // ex: "09:00"
  closeTime: string; // ex: "14:00"
}

@ValidatorConstraint({ async: false })
export class IsOpeningHoursValidConstraint implements ValidatorConstraintInterface {
  validate(hours: OpeningHour[], args: ValidationArguments) {
    if (!hours || !Array.isArray(hours)) return false;

    for (let i = 0; i < hours.length; i++) {
        const current = hours[i];
        
        // Validation simple du format
        if (typeof current.day !== 'number' || current.day < 0 || current.day > 6) return false;
        if (!current.openTime || !current.closeTime) return false;

        // La fermeture doit être après l'ouverture
        if (current.openTime >= current.closeTime) return false;

        // Vérification des chevauchements avec les autres créneaux du même jour
        for (let j = i + 1; j < hours.length; j++) {
            const other = hours[j];
            if (current.day === other.day) {
                // S'il y a un chevauchement
                if (current.openTime < other.closeTime && current.closeTime > other.openTime) {
                    return false;
                }
            }
        }
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Les horaires d\'ouverture sont invalides ou se chevauchent.';
  }
}

export function IsOpeningHoursValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsOpeningHoursValidConstraint,
    });
  };
}
