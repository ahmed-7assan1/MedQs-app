import { auth } from "@/lib/auth";
import { SidebarProvider } from "@/contexts/SidebarContext";
import ModulesSidebar from "@/components/modules/ModulesSidebar";
import { MainContent } from "./MainContent";

export default async function ModulesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <ModulesSidebar
          userName={user?.name}
          userImage={user?.image}
          userId={user?.id}
        />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
