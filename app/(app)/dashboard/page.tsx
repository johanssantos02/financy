import { PaginaDashboard } from "@/src/pages/dashboard";

export const metadata = {
  title: "Dashboard | Financy",
};

export default async function Page({ searchParams }: PageProps<"/dashboard">) {
  return <PaginaDashboard searchParams={await searchParams} />;
}
