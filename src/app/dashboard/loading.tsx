import { Spinner } from "@/components/ui/Spinner";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <Spinner size={48} />
    </div>
  );
}
