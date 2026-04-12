"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminToggle from "@/components/admin/ui/AdminToggle";

interface ToggleActiveButtonProps {
  table: string;
  id: string;
  field: string;
  initialValue: boolean;
}

export default function ToggleActiveButton({
  table,
  id,
  field,
  initialValue,
}: ToggleActiveButtonProps) {
  const [checked, setChecked] = useState(initialValue);
  const router = useRouter();
  const supabase = createClient();

  async function handleToggle(value: boolean) {
    setChecked(value);
    const { error } = await supabase
      .from(table)
      .update({ [field]: value })
      .eq("id", id);
    if (error) {
      setChecked(!value);
    } else {
      router.refresh();
    }
  }

  return <AdminToggle checked={checked} onChange={handleToggle} size="small" />;
}
