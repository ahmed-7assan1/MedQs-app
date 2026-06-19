"use client";

import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Mail, Lock, User, Chrome, Loader2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export type AuthField = {
  name: string;
  label: string;
  type: "text" | "email" | "password";
  placeholder: string;
  icon: "user" | "mail" | "lock";
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1S8.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12S6.8 21.5 12 21.5c6.9 0 9.4-4.8 9.4-7.3 0-.5-.1-.9-.2-1.4L12 12.8z"/>
    </svg>
  );
}

export function NewAuthForm({ fields, submitLabel, onSubmit, loading, extra, onGoogle }: {
  fields: AuthField[];
  submitLabel: string;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
  extra?: ReactNode;
  onGoogle?: () => void;
}) {
  const [show, setShow] = useState<Record<string, boolean>>({});
  const iconMap = { user: User, mail: Mail, lock: Lock };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {onGoogle && (
        <>
          <motion.button
            type="button"
            onClick={onGoogle}
            disabled={loading}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease }}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-shadow hover:shadow-md disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </motion.button>

          {fields.length > 0 && (
            <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or continue with email
              <div className="h-px flex-1 bg-border" />
            </div>
          )}
        </>
      )}

      {fields.map((f, i) => {
        const Icon = iconMap[f.icon];
        const isPwd = f.type === "password";
        const visible = show[f.name];
        return (
          <motion.div
            key={f.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease, delay: 0.05 * i }}
            className="flex flex-col gap-1.5"
          >
            <label htmlFor={f.name} className="text-xs font-medium text-foreground/80">{f.label}</label>
            <div className="group relative">
              <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" strokeWidth={2} />
              <input
                id={f.name}
                name={f.name}
                type={isPwd && visible ? "text" : f.type}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
              {isPwd && (
                <button type="button" onClick={() => setShow((s) => ({ ...s, [f.name]: !s[f.name] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label={visible ? "Hide password" : "Show password"}
                >
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
          </motion.div>
        );
      })}

      {extra}

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15, ease }}
        className="group mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] transition-all hover:bg-foreground/90 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
        {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
      </motion.button>
    </form>
  );
}
