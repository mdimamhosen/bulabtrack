import { createFileRoute } from "@tanstack/react-router";
import { AiAssistantPage } from "@/features/ai/ai-page";

export const Route = createFileRoute("/_authenticated/customer/ai")({
  head: () => ({ meta: [{ title: "AI Assistant — LabTrack" }] }),
  component: () => <AiAssistantPage roleBase="/customer" />,
});
