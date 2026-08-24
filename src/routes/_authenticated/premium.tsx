import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/premium")({
  beforeLoad: () => {
    throw redirect({ to: "/pro", replace: true });
  },
});
