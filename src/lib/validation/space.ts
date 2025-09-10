import { z } from 'zod';

export const updateSpaceSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요').max(255),
  slug: z
    .string()
    .min(1, '슬러그를 입력하세요')
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '영문 소문자, 숫자, 하이픈만 허용'),
});

export type UpdateSpaceGeneralInput = z.infer<typeof updateSpaceSchema>;
