import { getMySpaces } from '@/app/actions/space';
import Header from '@/components/layout/Header';
import 'server-only';

const HeaderServer = async ({ currentSpace }: { currentSpace?: string }) => {
  const spaces = await getMySpaces();

  return (
    <Header currentSpace={currentSpace} spaces={spaces} defaultCreateOpen={spaces.length === 0} />
  );
};

export default HeaderServer;
