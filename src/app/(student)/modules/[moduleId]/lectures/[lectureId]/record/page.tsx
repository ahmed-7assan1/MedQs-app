import { auth } from "@/lib/auth";
import { getLectureInModule } from "@/lib/lecture-navigation";
import { trackLectureView } from "@/lib/lecture-activity";
import { getSessionScope, isAdminRole } from "@/lib/tenant";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Headphones, Clock, GraduationCap } from "lucide-react";
import { LectureRecordStudio } from "@/components/content/LectureRecordStudio";
import TopBar from "@/components/modules/TopBar";
import PageContainer from "@/components/modules/PageContainer";

export const dynamic = "force-dynamic";

function toProperCase(str: string) {
  return str.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
}

export default async function LectureRecordPage({
  params,
  searchParams,
}: {
  params: { moduleId: string; lectureId: string };
  searchParams?: { r?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const scope = await getSessionScope(session);
  const isAdmin = isAdminRole(scope?.role);

  const lecture = await getLectureInModule(params.moduleId, params.lectureId);
  if (!lecture) notFound();
  await trackLectureView(session.user.id, params.lectureId, "record");

  const hub = `/modules/${params.moduleId}/lectures/${params.lectureId}`;
  const selected = searchParams?.r;
  const records = lecture.records && lecture.records.length > 0 ? lecture.records : [];

  return (
    <div className="min-h-screen bg-background">
      <TopBar userName={session?.user?.name} userImage={session?.user?.image} />
      <PageContainer>
        <div className="pt-6">
          {/* 1. BREADCRUMBS */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-[13px] font-normal text-muted-foreground/60">
        <Link href="/modules" className="hover:text-primary transition-colors">Modules</Link>
        <span className="text-[11px] opacity-30 select-none">›</span>
        <Link href={`/modules/${params.moduleId}`} className="hover:text-primary transition-colors truncate max-w-[150px]">
          {lecture.subject.module.name}
        </Link>
        <span className="text-[11px] opacity-30 select-none">›</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/20">
            {lecture.subject.name}
          </span>
          <span className="font-medium text-foreground">{toProperCase(lecture.title)}</span>
        </div>
      </nav>

      {/* 2. PAGE TITLE & METADATA */}
      <div className="mb-10 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary leading-[1.2]">
          {toProperCase(lecture.title)} <span className="text-foreground opacity-60">Audio Records</span>
        </h1>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3.5 py-1.5 text-[12px] font-semibold text-muted-foreground ring-1 ring-border/50">
            <GraduationCap className="h-3.5 w-3.5" />
            {lecture.subject.name}
          </div>

          <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

          <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground font-medium">
            <div className="flex items-center gap-1">
              {records.map((_: any, idx: number) => (
                <div key={idx} className={`h-1.5 w-1.5 rounded-full ${idx === 0 ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            <span>{records.length} {records.length === 1 ? 'Track' : 'Tracks'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground font-medium">
            <Clock className="h-4 w-4 opacity-40" />
            Listen
          </div>
        </div>
      </div>

      {records.length > 0 ? (
        <LectureRecordStudio
          lectureId={lecture.id}
          initialRecords={records.map((r: any) => ({
            id: r.id,
            title: r.title,
            url: r.url,
            sourceType: r.sourceType,
          }))}
          selectedRecordId={selected}
          isAdmin={isAdmin}
          hubUrl={hub}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 py-16">
          <Headphones className="h-10 w-10 text-muted-foreground opacity-25" />
          <p className="text-sm text-muted-foreground">No audio records found for this lecture</p>
          <div className="mt-8">
            <Link href={hub} className="text-sm font-medium text-primary hover:underline">
              ← Back to lecture hub
            </Link>
          </div>
        </div>
      )}
        </div>
      </PageContainer>
    </div>
  );
}
