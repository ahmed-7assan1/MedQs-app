"use client";

import React from 'react';
import * as Icons from "@phosphor-icons/react";

export type IconName = keyof typeof Icons;

interface PhosphorIconProps extends Icons.IconProps {
  name: string; // Using string to allow dynamic names, we'll cast to keyof typeof Icons
}

export const PhosphorIcon = ({ name, ...props }: PhosphorIconProps) => {
  // Try to find the icon by name
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    console.warn(`[PhosphorIcon] Icon "${name}" not found in @phosphor-icons/react`);
    return <Icons.Question {...props} />;
  }

  return <IconComponent {...props} />;
};
