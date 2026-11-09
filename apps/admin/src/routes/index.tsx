import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

export function Home() {
  return (
    <main>
      <h1>Coffee Map administration</h1>
      <p>Admin access is not configured.</p>
      <p>No private data or editing actions are available in this scaffold.</p>
    </main>
  );
}
