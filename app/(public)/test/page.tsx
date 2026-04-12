import { createClient } from "@/lib/supabase/server";

export default async function TestPage() {
  const supabase = await createClient();
  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order");

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Supabase Connection Test</h1>
      {error ? (
        <p style={{ color: "red" }}>Error: {error.message}</p>
      ) : (
        <div>
          <p style={{ color: "green" }}>
            Connected! Found {services?.length ?? 0} services.
          </p>
          <ul>
            {services?.map((s) => (
              <li key={s.id}>
                <strong>{s.name}</strong> — {s.price_label} ({s.duration}) —{" "}
                <em>{s.tag}</em>
                <br />
                <small>{s.short_description}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
