"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EngagementAccount } from "@/types";
import AdminInput from "@/components/admin/ui/AdminInput";
import AdminTextarea from "@/components/admin/ui/AdminTextarea";
import AdminToggle from "@/components/admin/ui/AdminToggle";
import Toast from "@/components/admin/ui/Toast";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";

interface EngagementAccountsClientProps {
  accounts: EngagementAccount[];
}

const emptyForm = {
  handle: "",
  platform: "instagram",
  followers: "",
  niche: "",
  why_engage: "",
};

export default function EngagementAccountsClient({
  accounts,
}: EngagementAccountsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EngagementAccount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const startEdit = useCallback((account: EngagementAccount) => {
    setForm({
      handle: account.handle,
      platform: account.platform || "instagram",
      followers: account.followers || "",
      niche: account.niche || "",
      why_engage: account.why_engage || "",
    });
    setEditingId(account.id);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.handle.trim()) {
      setToast({ message: "Handle is required", type: "error" });
      return;
    }

    setSaving(true);

    const payload = {
      handle: form.handle.trim(),
      platform: form.platform || "instagram",
      followers: form.followers.trim() || null,
      niche: form.niche.trim() || null,
      why_engage: form.why_engage.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("engagement_accounts")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        setToast({ message: "Failed to update account", type: "error" });
        setSaving(false);
        return;
      }
      setToast({ message: "Account updated", type: "success" });
    } else {
      const { error } = await supabase
        .from("engagement_accounts")
        .insert({ ...payload, is_active: true });

      if (error) {
        setToast({ message: "Failed to add account", type: "error" });
        setSaving(false);
        return;
      }
      setToast({ message: "Account added", type: "success" });
    }

    setSaving(false);
    resetForm();
    router.refresh();
  }, [form, editingId, supabase, router, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const { error } = await supabase
      .from("engagement_accounts")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      setToast({ message: "Failed to delete account", type: "error" });
    } else {
      setToast({ message: "Account deleted", type: "success" });
    }

    setDeleting(false);
    setDeleteTarget(null);
    router.refresh();
  }, [deleteTarget, supabase, router]);

  const handleToggleActive = useCallback(
    async (account: EngagementAccount) => {
      const { error } = await supabase
        .from("engagement_accounts")
        .update({ is_active: !account.is_active })
        .eq("id", account.id);

      if (error) {
        setToast({ message: "Failed to update status", type: "error" });
        return;
      }

      setToast({
        message: account.is_active ? "Account deactivated" : "Account activated",
        type: "success",
      });
      router.refresh();
    },
    [supabase, router]
  );

  return (
    <div className="space-y-6 mt-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          title="Delete account"
          message={`Are you sure you want to delete ${deleteTarget.handle}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Add/Edit Form */}
      {showForm ? (
        <div className="bg-white border border-[#e8e5df] rounded-xl p-5 space-y-4">
          <h3 className="font-heading text-lg text-[#1a1a18]">
            {editingId ? "Edit account" : "Add new account"}
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <AdminInput
              id="handle"
              label="Handle"
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value })}
              placeholder="@username"
              required
            />
            <AdminInput
              id="platform"
              label="Platform"
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              placeholder="instagram"
            />
            <AdminInput
              id="followers"
              label="Followers"
              value={form.followers}
              onChange={(e) => setForm({ ...form, followers: e.target.value })}
              placeholder="e.g. 12.4K"
            />
            <AdminInput
              id="niche"
              label="Niche"
              value={form.niche}
              onChange={(e) => setForm({ ...form, niche: e.target.value })}
              placeholder="e.g. Astrology, Wellness"
            />
          </div>

          <AdminTextarea
            id="why_engage"
            label="Why engage?"
            value={form.why_engage}
            onChange={(e) => setForm({ ...form, why_engage: e.target.value })}
            placeholder="Why is this account worth engaging with?"
            rows={2}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-medium px-5 py-2.5 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Add account"}
            </button>
            <button
              onClick={resetForm}
              className="text-sm text-[#6b6560] hover:text-[#1a1a18] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-medium px-5 py-2.5 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors"
        >
          + Add account
        </button>
      )}

      {/* Accounts Table */}
      {accounts.length === 0 ? (
        <div className="bg-white border border-[#e8e5df] rounded-xl p-8 text-center">
          <p className="text-[#6b6560]">
            No engagement accounts yet. Add your first account above.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8e5df] bg-[#fafaf8]">
                <th className="px-5 py-2.5 text-left text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Handle
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-[#6b6560] uppercase tracking-wider hidden md:table-cell">
                  Followers
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-[#6b6560] uppercase tracking-wider hidden md:table-cell">
                  Niche
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-[#6b6560] uppercase tracking-wider hidden lg:table-cell">
                  Why engage
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Active
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-[#6b6560] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr
                  key={account.id}
                  className="border-b border-[#e8e5df] last:border-0 hover:bg-[#f5f3ef] transition-colors"
                >
                  <td className="px-5 py-3 text-sm font-medium text-[#1a1a18]">
                    {account.handle}
                  </td>
                  <td className="px-5 py-3 text-sm text-[#6b6560] hidden md:table-cell">
                    {account.followers || "—"}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {account.niche ? (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {account.niche}
                      </span>
                    ) : (
                      <span className="text-sm text-[#6b6560]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-[#6b6560] max-w-xs truncate hidden lg:table-cell">
                    {account.why_engage || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <AdminToggle
                      checked={account.is_active}
                      onChange={() => handleToggleActive(account)}
                      size="small"
                    />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(account)}
                        className="text-sm text-deep hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(account)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
