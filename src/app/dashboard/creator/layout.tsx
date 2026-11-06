"use client";

import CreatorProtectedRoute from "@/components/CreatorProtectedRoute";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CreatorProtectedRoute>{children}</CreatorProtectedRoute>;
}

