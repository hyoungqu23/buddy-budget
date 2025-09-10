import { z } from 'zod';

export const colorHex = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, '유효한 색상 코드가 아닙니다(#RRGGBB)');

export const categoryKindEnum = z.enum(['expense', 'income'], {
  required_error: '카테고리 종류를 선택하세요',
});

export const categoryCreateSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요').max(50, '50자 이내로 입력하세요'),
  kind: categoryKindEnum,
  color: colorHex,
  icon: z.string().max(64).optional().or(z.literal('')),
});

export const categoryUpdateSchema = categoryCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: '수정할 항목이 없습니다' });

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
