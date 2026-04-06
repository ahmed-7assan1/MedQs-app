import { StudentPageShell } from "@/components/layout/StudentPageShell";

export const metadata = {
  title: "Terms of Use",
  description: "Terms and acceptable use for the MedQs platform.",
};

export default function TermsPage() {
  return (
    <StudentPageShell
      eyebrow="Legal"
      title="Terms of Use"
      subtitle="By using this platform you agree to use it responsibly and in line with your school’s academic integrity rules."
      maxWidthClass="max-w-3xl"
    >
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Educational use</h2>
          <p>
            MedQs is intended for learning and assessment practice. Content and AI-generated explanations may
            contain errors; always verify critical information with official course materials and instructors.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Not medical advice</h2>
          <p>
            Nothing on this site constitutes professional medical advice, diagnosis, or treatment. Clinical
            decisions must follow your training program and supervising physicians only.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Acceptable conduct</h2>
          <p>
            Harassment, cheating, sharing of exam materials where prohibited, or misuse of accounts may
            result in suspension or other action by your institution or operators.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Availability</h2>
          <p>
            We strive for reliability but do not guarantee uninterrupted access. Scheduled maintenance or
            third-party outages may affect the service.
          </p>
        </section>
        <p className="text-xs text-muted-foreground/80">
          This page is a general template. Operators should align it with institutional policies and local law.
        </p>
      </div>
    </StudentPageShell>
  );
}
