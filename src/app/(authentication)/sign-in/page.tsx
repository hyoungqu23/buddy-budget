import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { signInWithGoogle } from './actions';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams?: Promise<{ error?: string; next?: string }>;
};

const SignInPage = async ({ searchParams }: Props) => {
  const error = (await searchParams)?.error;
  const next = (await searchParams)?.next ?? '';

  return (
    <main className='min-h-screen flex items-center justify-center p-6'>
      <div className='w-full max-w-sm space-y-6'>
        <div className='text-center space-y-2'>
          <div className='flex justify-center'>
            <Image src='/easynext.png' width={48} height={48} alt='BuddyBudget' />
          </div>
          <h1 className='text-2xl font-semibold'>BuddyBudget에 로그인</h1>
          <p className='text-sm text-muted-foreground'>Google 계정으로 빠르게 시작하세요</p>
        </div>

        <form action={signInWithGoogle} method='post' className='space-y-4'>
          <input type='hidden' name='next' value={next} />
          <Button type='submit' className='w-full' aria-label='Google로 로그인'>
            Google로 계속하기
          </Button>
        </form>

        <div aria-live='polite' aria-atomic='true' className='min-h-6 text-sm text-destructive'>
          {error && <span role='status'>{decodeURIComponent(error)}</span>}
        </div>

        <p className='text-xs text-muted-foreground text-center'>
          로그인 시 개인정보 최소수집 정책에 동의한 것으로 간주됩니다.
        </p>
      </div>
    </main>
  );
};

export default SignInPage;
