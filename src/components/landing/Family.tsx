"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { FAMILY, EASE, VIEWPORT } from "./marketing-data";

interface MemberData {
  id: string;
  name: string;
  role: string;
  description?: string;
  imageUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
}

const SOCIAL_CONFIG = [
  { key: "linkedin", label: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
  { key: "facebook", label: "Facebook", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
  { key: "twitter", label: "X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { key: "instagram", label: "Instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" },
] as const;

const FIELDS_BY_PLATFORM: Record<string, keyof MemberData> = {
  linkedin: "linkedinUrl",
  facebook: "facebookUrl",
  twitter: "twitterUrl",
  instagram: "instagramUrl",
};

function memberSocialLinks(m: MemberData) {
  return SOCIAL_CONFIG.filter(({ key }) => {
    const field = FIELDS_BY_PLATFORM[key];
    return m[field];
  }).map(({ key, path, label }) => {
    const field = FIELDS_BY_PLATFORM[key];
    return { platform: key, url: m[field] as string, path, label };
  });
}

function AmbientGlow() {
  return (
    <div
      className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent opacity-0 scale-90 blur-2xl transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-100 pointer-events-none"
      aria-hidden="true"
    />
  );
}

function AvatarAmbientGlow() {
  return (
    <div
      className="absolute inset-0 rounded-full bg-gradient-to-b from-primary/20 via-primary/10 to-transparent opacity-0 scale-75 blur-lg transition-all duration-600 ease-out group-hover:opacity-100 group-hover:scale-110 pointer-events-none"
      aria-hidden="true"
    />
  );
}

function SocialIcon({
  platform,
  url,
  path,
  label,
}: {
  platform: string;
  url: string;
  path: string;
  label: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-sm hover:shadow-primary/10"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d={path} />
      </svg>
    </a>
  );
}

function MemberCard({ member, index }: { member: MemberData; index: number }) {
  const socialLinks = memberSocialLinks(member);

  return (
    <div className="relative group">
      <AmbientGlow />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT}
        transition={{ duration: 0.5, ease: EASE, delay: index * 0.07 }}
        className="relative flex flex-col items-center rounded-2xl border border-border bg-background p-8 text-center shadow-sm transition-all duration-400 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-primary/20"
      >
        <div className="relative h-24 w-24">
          <AvatarAmbientGlow />
          <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-primary/10 bg-secondary transition-all duration-400 group-hover:border-primary/30">
            <img
              src={member.imageUrl || `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(member.name)}`}
              alt={member.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <h3 className="mt-5 text-lg font-semibold">{member.name}</h3>
        <span className="mt-1 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
          {member.role}
        </span>
        {member.description && (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {member.description}
          </p>
        )}
        {socialLinks.length > 0 && (
          <div className="mt-6 flex items-center gap-3">
            {socialLinks.map((link) => (
              <SocialIcon key={link.platform} {...link} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function Family() {
  const [members, setMembers] = useState<MemberData[]>([]);

  useEffect(() => {
    fetch("/api/v1/founders")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMembers(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="family" className="bg-card/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow={FAMILY.eyebrow}
          title={FAMILY.title}
          subtitle={FAMILY.subtitle}
        />
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {members.map((m, i) => (
            <MemberCard key={m.id} member={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}