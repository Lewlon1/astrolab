import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, source, name } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .insert({ email, source: source || "website_form" });

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
