/**
 * TypeScript функція для парсингу та валідації JSON з обробкою помилок
 */

interface ValidationError {
  field: string;
  message: string;
}

interface ParseResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Парсить та валідує JSON з обробкою помилок
 * @param jsonString - JSON рядок для парсингу
 * @param schema - опціональна схема валідації (можна розширити)
 * @returns ParseResult з даними або помилками
 */
function parseJson<T>(
  jsonString: string,
  schema?: Partial<Record<keyof T, (value: any) => boolean>>
): ParseResult<T> {
  const errors: ValidationError[] = [];

  // Парсинг JSON
  let jsonData: T;
  try {
    jsonData = JSON.parse(jsonString);
  } catch (parseError) {
    errors.push({
      field: 'root',
      message: 'Некоректний JSON формат'
    });
    return { success: false, errors };
  }

  // Валідація за схемою (якщо надана)
  if (schema) {
    for (const [field, validatorFn] of Object.entries(schema)) {
      const value = (jsonData as any)[field];
      if (!(validatorFn as (value: any) => boolean)(value)) {
        errors.push({
          field,
          message: `Некоректне значення для поля ${field}`
        });
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: jsonData };
}

// Приклад використання
interface UserData {
  id: number;
  name: string;
  email: string;
  age?: number;
}

function main() {
  const jsonString = '{"id": 1, "name": "Test", "email": "test@example.com"}';
  
  const result = parseJson<UserData>(jsonString, {
    id: (value: any) => typeof value === 'number' && value > 0,
    name: (value: any) => typeof value === 'string' && value.length > 0,
    email: (value: any) => typeof value === 'string' && value.includes('@'),
  });

  if (result.success) {
    console.log('✅ JSON валідний:', result.data);
  } else {
    console.error('❌ Помилки валідації:');
    result.errors?.forEach((err: ValidationError) => {
      console.error(`  - ${err.field}: ${err.message}`);
    });
  }
}

export { parseJson, ParseResult, ValidationError };
