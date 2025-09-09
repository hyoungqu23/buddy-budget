import Link from "next/link";

const Home = () => {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">BuddyBudget</h1>
      <p className="mt-2 text-muted-foreground">
        공동 생활자·가족을 위한 간편 머니 트래킹.
      </p>
      <div className="mt-6">
        <Link className="underline text-primary" href="/demo">
          데모 대시보드로 이동 (/demo)
        </Link>
      </div>
    </main>
  );
};

export default Home;
