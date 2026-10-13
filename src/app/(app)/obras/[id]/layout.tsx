import { ProjectNav } from "@/components/project-nav";

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <ProjectNav id={id} />
      {children}
    </div>
  );
}
