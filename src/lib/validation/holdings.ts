import { colorHex } from '@/lib/validation/categories';
import { z } from 'zod';

export const holdingTypeEnum = z.enum(['bank', 'card', 'cash', 'etc'], {
  required_error: '계정 유형을 선택하세요',
});

export const holdingCreateSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요').max(50, '50자 이내로 입력하세요'),
  type: holdingTypeEnum,
  color: colorHex,
  currency: z.string().min(1).max(8).default('KRW'),
  openingBalance: z.coerce.number().min(0, '0 이상을 입력하세요'),
});

export const holdingUpdateSchema = holdingCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: '수정할 항목이 없습니다' });

export type HoldingCreateInput = z.infer<typeof holdingCreateSchema>;
export type HoldingUpdateInput = z.infer<typeof holdingUpdateSchema>;
