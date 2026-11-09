import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

export function Home() {
  return (
    <main>
      <h1>CLT Coffee Map</h1>
      <p>The coffee shop directory is being prepared.</p>
      <p>Discover local coffee shops without creating an account.</p>
    </main>
  );
}
