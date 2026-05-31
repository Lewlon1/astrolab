import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    email,
    source,
    name,
    session_key,
    referrer,
    utm_source,
    utm_medium,
    utm_campaign,
    landing_path,
  } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const supabase = await createClient();

  // Insert with attribution. If the attribution columns aren't present yet
  // (migration 009 not applied), fall back to the base insert so a signup is
  // never lost over a deploy/migration ordering gap.
  let { error } = await supabase.from("leads").insert({
    email,
    source: source || "website_form",
    session_key: session_key || null,
    referrer: referrer || null,
    utm_source: utm_source || null,
    utm_medium: utm_medium || null,
    utm_campaign: utm_campaign || null,
    landing_path: landing_path || null,
  });

  if (error) {
    const fallback = await supabase
      .from("leads")
      .insert({ email, source: source || "website_form" });
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Sync to MailerLite (fire-and-forget — don't block the response)
  const mailerLiteApiKey = process.env.MAILERLITE_API_KEY;

  if (mailerLiteApiKey) {
    fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mailerLiteApiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        fields: {
          name: name || undefined,
        },
        status: "active",
      }),
    }).catch((err) => {
      console.error("MailerLite sync failed:", err);
    });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
