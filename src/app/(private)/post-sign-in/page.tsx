import HeaderServer from '@/components/layout/HeaderServer';
import CreateSpaceDialog from '@/components/space/CreateSpaceDialog';

const PostSignIn = async () => {
  return (
    <main className="min-h-dvh">
      <HeaderServer />
      <section className="mx-auto flex max-w-xl flex-col items-center gap-6 p-6 text-center">
        <h1 className="text-2xl font-semibold">스페이스를 만들어 시작해요</h1>
        <p className="text-muted-foreground">
          아직 참여 중인 스페이스가 없습니다. 아래에서 새 스페이스를 생성해주세요.
        </p>
        <CreateSpaceDialog defaultOpen>
          <button className="sr-only">스페이스 만들기</button>
        </CreateSpaceDialog>
      </section>
    </main>
  );
};

export default PostSignIn;

