"use client";

import { Suspense } from "react";
import PrintfulDashboardContent from "./components/PrintfulDashboardContent";


export default function PrintfulDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrintfulDashboardContent />
    </Suspense>
  );
}






