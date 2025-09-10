import { getMySpaces } from '@/app/actions/space';
import HeaderServer from '@/components/layout/HeaderServer';
import CreateSpaceDialog from '@/components/space/CreateSpaceDialog';
import { getUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

const HomeGate = async () => {
  const user = await getUser();

  if (!user) redirect('/sign-in');

  const spaces = await getMySpaces();

  if (spaces.length > 0) {
    redirect(`/${spaces[0]!.slug}`);
  }

  return (
    <main className='min-h-dvh'>
      <HeaderServer />
      <section className='mx-auto flex max-w-xl flex-col items-center gap-6 p-6 text-center'>
        <h1 className='text-2xl font-semibold'>스페이스를 만들어 시작해요</h1>
        <p className='text-muted-foreground'>
          아직 참여 중인 스페이스가 없습니다. 아래에서 새 스페이스를 생성해주세요.
        </p>
        <CreateSpaceDialog defaultOpen>
          <button className='sr-only'>스페이스 만들기</button>
        </CreateSpaceDialog>
      </section>
    </main>
  );
};

export default HomeGate;
