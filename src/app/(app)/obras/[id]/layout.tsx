import { ProjectNav } from "@/components/project-nav";
import { WarmObraRoutes } from "@/components/warm-obra";

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <ProjectNav id={id} />
      <WarmObraRoutes id={id} />
      {children}
    </div>
  );
}
