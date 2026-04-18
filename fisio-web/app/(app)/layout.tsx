import { AppShell } from "@/components/app-shell";
import { MockDataProvider } from "@/components/mock-data-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MockDataProvider>
      <AppShell>{children}</AppShell>
    </MockDataProvider>
  );
}
