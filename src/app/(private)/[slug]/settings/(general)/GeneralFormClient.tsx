'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { GeneralFormState } from './actions';

type Props = {
  slug: string;
  defaultName: string;
  defaultSlug: string;
  action: (slug: string, state: GeneralFormState, formData: FormData) => Promise<GeneralFormState>;
};

const initialState: GeneralFormState = { ok: false };

const GeneralFormClient = ({ slug, defaultName, defaultSlug, action }: Props) => {
  const router = useRouter();
  const [state, formAction] = useFormState(action.bind(null, slug), initialState);

  useEffect(() => {
    if (!('ok' in state)) return;
    if (state.ok) {
      toast({ description: '저장했어요.' });
      if (state.slug && state.slug !== slug) {
        router.replace(`/${state.slug}/settings/(general)`);
      } else {
        // 슬러그 변경이 없을 때도 서버 컴포넌트 갱신
        router.refresh();
      }
    } else if (state.error) {
      toast({ description: state.error });
    }
  }, [state, slug, router]);

  const Submit = () => {
    const { pending } = useFormStatus();
    return (
      <Button type='submit' disabled={pending}>
        {pending ? '저장 중…' : '저장'}
      </Button>
    );
  };

  return (
    <form action={formAction} className='space-y-4'>
      <div className='space-y-1'>
        <label className='text-sm font-medium'>스페이스 이름</label>
        <Input
          name='name'
          defaultValue={defaultName}
          placeholder='예: 우리집 공동가계부'
          required
        />
        {state.fieldErrors?.name && (
          <p role='status' aria-live='polite' className='text-xs text-destructive'>
            {state.fieldErrors.name}
          </p>
        )}
      </div>
      <div className='space-y-1'>
        <label className='text-sm font-medium'>슬러그</label>
        <Input
          name='slug'
          defaultValue={defaultSlug}
          placeholder='영문 소문자-숫자-하이픈'
          required
        />
        <p className='text-xs text-muted-foreground'>변경 시 주소가 /[slug]로 바뀝니다.</p>
        {state.fieldErrors?.slug && (
          <p role='status' aria-live='polite' className='text-xs text-destructive'>
            {state.fieldErrors.slug}
          </p>
        )}
      </div>
      <Submit />
    </form>
  );
};

export default GeneralFormClient;
