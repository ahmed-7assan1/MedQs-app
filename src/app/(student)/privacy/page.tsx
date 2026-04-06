import { StudentPageShell } from "@/components/layout/StudentPageShell";

export const metadata = {
  title: "Privacy Policy",
  description: "How MedQs handles your data and account information.",
};

export default function PrivacyPage() {
  return (
    <StudentPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="Summary of how we treat personal data on this platform. For the full legal text, consult your institution if MedQs is deployed on their behalf."
      maxWidthClass="max-w-3xl"
    >
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">What we collect</h2>
          <p>
            Typical data includes account details you provide (name, email, student identifiers where
            applicable), activity on the platform (quiz attempts, forum posts, progress), and technical logs
            needed to run the service securely.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">AI chat (Dr. Q)</h2>
          <p>
            Messages you send to the AI may be processed by external model providers according to your
            deployment&apos;s configuration. Some conversation topics may be stored only in your browser
            (local storage) and not on our servers — see the in-app notice on the chat page.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Cookies & storage</h2>
          <p>
            We use cookies and similar storage for sign-in sessions, theme preferences, and essential app
            functionality. Analytics or marketing cookies are only used if your deployment enables them.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Your choices</h2>
          <p>
            You may request account deletion or data export where required by law, through your school
            administrator or the contact provided on your deployment.
          </p>
        </section>
        <p className="text-xs text-muted-foreground/80">
          This page is a general template. Operators should replace or extend it with jurisdiction-specific
          policies and a designated contact.
        </p>
      </div>
    </StudentPageShell>
  );
}
