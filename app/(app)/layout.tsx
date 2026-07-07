import { OrgProvider } from "@/lib/context/org-context";
import { Sidebar } from "@/components/layout/sidebar";
import { FeedbackButton } from "@/components/feedback-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
        <FeedbackButton />
      </div>
    </OrgProvider>
  );
}
