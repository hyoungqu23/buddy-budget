import { updateSpaceGeneral } from '@/app/actions/space';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const GeneralSettingsPage = async ({ params }: { params: { slug: string } }) => {
  const slug = params.slug;

  return (
    <div className='max-w-xl space-y-6'>
      <div>
        <h2 className='text-xl font-semibold'>일반 설정</h2>
        <p className='text-sm text-muted-foreground'>
          스페이스 이름과 슬러그를 변경할 수 있습니다.
        </p>
      </div>

      <form
        action={async (formData) => {
          'use server';
          const name = String(formData.get('name') || '').trim();
          const newSlug = String(formData.get('slug') || '').trim();
          await updateSpaceGeneral(slug, { name, slug: newSlug });
        }}
        className='space-y-4'
      >
        <div className='space-y-2'>
          <label className='text-sm font-medium'>스페이스 이름</label>
          <Input name='name' placeholder='예: 우리집 공동가계부' required />
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>슬러그</label>
          <Input name='slug' placeholder='영문 소문자-숫자-하이픈' required />
          <p className='text-xs text-muted-foreground'>변경 시 주소가 /[slug]로 바뀝니다.</p>
        </div>
        <Button type='submit'>저장</Button>
      </form>
    </div>
  );
};

export default GeneralSettingsPage;
