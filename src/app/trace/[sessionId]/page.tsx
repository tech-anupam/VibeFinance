"use client";

import { useParams } from "next/navigation";

export default function TracePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Session Trace</h1>
      <p className="text-sm text-text-secondary">Session: {sessionId}</p>
      <div className="rounded border border-border bg-surface p-4">
        <p className="text-sm text-text-muted">
          Full agent outputs, verifier events, and arbiter weights for this session
          will be displayed here once session persistence is connected.
        </p>
      </div>
    </div>
  );
}
