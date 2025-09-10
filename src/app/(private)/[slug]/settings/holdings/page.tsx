import {
  createHolding,
  deleteHolding,
  listInfiniteHoldings,
  updateHolding,
} from '@/app/actions/holdings';
import HoldingsClient from './HoldingsClient';

const HoldingsSettingsPage = async ({ params }: { params: { slug: string } }) => {
  const slug = params.slug;
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>계정(Holdings)</h2>
      <HoldingsClient
        slug={slug}
        actions={{
          listAction: listInfiniteHoldings,
          createAction: createHolding,
          updateAction: updateHolding,
          deleteAction: deleteHolding,
        }}
      />
    </div>
  );
};

export default HoldingsSettingsPage;
