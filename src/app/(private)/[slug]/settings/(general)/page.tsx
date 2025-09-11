import { getSpaceGeneral } from '@/app/actions/space';
import GeneralFormClient from './GeneralFormClient';
import { submitGeneral } from './actions';

const GeneralSettingsPage = async ({ params }: { params: { slug: string } }) => {
  const slug = params.slug;
  const space = await getSpaceGeneral(slug);

  return (
    <div className='max-w-xl space-y-6'>
      <div>
        <h2 className='text-xl font-semibold'>일반 설정</h2>
        <p className='text-sm text-muted-foreground'>
          스페이스 이름과 슬러그를 변경할 수 있습니다.
        </p>
      </div>

      <GeneralFormClient
        slug={slug}
        defaultName={space.name}
        defaultSlug={space.slug}
        action={submitGeneral}
      />
    </div>
  );
};

export default GeneralSettingsPage;
