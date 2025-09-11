'use server';

import { updateSpaceGeneralNoRedirect } from '@/app/actions/space';
import { updateSpaceSchema } from '@/lib/validation/space';

export type GeneralFormState = {
  ok: boolean;
  error?: string;
  slug?: string;
  fieldErrors?: { name?: string; slug?: string };
};

export const submitGeneral = async (
  currentSlug: string,
  _prevState: GeneralFormState,
  formData: FormData,
): Promise<GeneralFormState> => {
  const name = String(formData.get('name') || '').trim();
  const newSlug = String(formData.get('slug') || '').trim();

  // 1) 클라이언트 제출값에 대해 우선 zod로 필드별 에러 수집
  const parsed = updateSpaceSchema.safeParse({ name, slug: newSlug });
  if (!parsed.success) {
    const fe: GeneralFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path?.[0];
      if (path === 'name') fe.name = issue.message;
      if (path === 'slug') fe.slug = issue.message;
    }
    return { ok: false, fieldErrors: fe };
  }

  // 2) 서버 측 업데이트 시도 및 충돌/오류 매핑
  try {
    const updated = await updateSpaceGeneralNoRedirect(currentSlug, parsed.data);
    return { ok: true, slug: updated.slug };
  } catch (e) {
    const msg = e instanceof Error ? e.message : '저장 중 오류가 발생했습니다';
    // 슬러그 중복 에러는 필드 에러로 내려줌
    if (msg.includes('슬러그')) {
      return { ok: false, fieldErrors: { slug: msg } };
    }
    return { ok: false, error: msg };
  }
};
