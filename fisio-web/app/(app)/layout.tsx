import { AppSidebar } from "@/components/app-sidebar";
import { MockDataProvider } from "@/components/mock-data-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MockDataProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </MockDataProvider>
  );
}
