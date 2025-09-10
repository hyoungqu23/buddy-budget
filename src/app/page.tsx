import { Button } from '@/components/ui/button';
import { getUser } from '@/lib/auth/session';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const Landing = async () => {
  const user = await getUser();
  return (
    <main className='mx-auto max-w-2xl p-6'>
      <h1 className='text-2xl font-bold'>BuddyBudget</h1>
      <p className='mt-2 text-muted-foreground'>간편하게 공유하기, 편리하게 관리하기</p>
      <div className='mt-6'>
        <Link className='underline text-primary' href='/demo'>
          데모 대시보드로 이동 (/demo)
        </Link>
      </div>
      {user && (
        <div className='fixed bottom-6 right-6'>
          <Link href='/home'>
            <Button
              className='shadow-lg gap-2 animate-[fadeIn_300ms_ease-out_1] hover:scale-[1.02] transition'
              aria-label='내 스페이스로 이동'
            >
              내 스페이스로 가기
              <ArrowRight className='size-4' />
            </Button>
          </Link>
        </div>
      )}
    </main>
  );
};

export default Landing;
