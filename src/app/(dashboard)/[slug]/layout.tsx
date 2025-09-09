import BottomNav from "@/components/layout/BottomNav";
import HeaderServer from "@/components/layout/HeaderServer";
import Sidebar from "@/components/layout/Sidebar";

const DashboardLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  return (
    <div className="min-h-dvh">
      {/* 서버에서 사용자 스페이스 목록 조회 */}
      <HeaderServer currentSpace={slug} />
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 md:grid-cols-[240px_1fr]">
        <Sidebar slug={slug} />
        <main className="min-h-[calc(100dvh-3.5rem)] p-3 pb-20 md:h-[calc(100dvh-4rem)] md:p-6 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav slug={slug} />
    </div>
  );
};

export default DashboardLayout;
