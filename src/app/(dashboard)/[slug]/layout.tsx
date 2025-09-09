import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

const DashboardLayout = ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) => {
  const { slug } = params;
  return (
    <div className="min-h-dvh">
      <Header currentSpace={slug} />
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
