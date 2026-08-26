import { supabase } from "@/integrations/supabase/client";

export type StudentInboxItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
  source: "notifications" | "document_notifications";
};

export function mapInboxType(raw: string) {
  const type = String(raw || "").toLowerCase();
  if (["approval", "approved", "success", "upload_success"].includes(type)) return "success";
  if (["rejection", "rejected", "error"].includes(type)) return "error";
  if (["request", "warning"].includes(type)) return "warning";
  if (["chat", "message", "info"].includes(type)) return "info";
  return "info";
}

export function inboxActionUrl(raw: string, fallback?: string | null) {
  if (fallback) return fallback;
  const type = String(raw || "").toLowerCase();
  if (type.includes("chat") || type.includes("message")) return "/student/chat";
  if (type.includes("shortlist")) return "/student/shortlists";
  if (type.includes("application")) return "/student/applications";
  return "/student/documents";
}

export async function notifyStudent(input: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  actionUrl?: string;
  documentId?: string | null;
}) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const type = input.type || "info";
  const actionUrl = input.actionUrl || inboxActionUrl(type);
  const payload = {
    id,
    user_id: input.userId,
    title: input.title,
    message: input.message,
    type,
    notification_type: type,
    action_url: actionUrl,
    is_read: false,
    created_at: now,
    document_id: input.documentId || null,
  };

  await supabase.from("notifications").insert({
    id: payload.id,
    user_id: payload.user_id,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    action_url: payload.action_url,
    is_read: false,
    created_at: payload.created_at,
  });

  await supabase.from("document_notifications").insert({
    id: payload.id,
    user_id: payload.user_id,
    title: payload.title,
    message: payload.message,
    notification_type: payload.notification_type,
    action_url: payload.action_url,
    is_read: false,
    created_at: payload.created_at,
    document_id: payload.document_id,
  });

  return id;
}

export async function loadStudentInbox(userId: string): Promise<StudentInboxItem[]> {
  const [{ data: inbox }, { data: documentNotes }] = await Promise.all([
    supabase.from("notifications").select("*").eq("user_id", userId),
    supabase.from("document_notifications").select("*").eq("user_id", userId),
  ]);

  const merged = new Map<string, StudentInboxItem>();

  for (const item of inbox || []) {
    merged.set(item.id, {
      id: item.id,
      title: item.title || "Notification",
      message: item.message || "",
      type: mapInboxType(item.type),
      is_read: Boolean(item.is_read),
      action_url: inboxActionUrl(item.type, item.action_url),
      created_at: item.created_at || new Date().toISOString(),
      source: "notifications",
    });
  }

  for (const item of documentNotes || []) {
    const existing = merged.get(item.id);
    merged.set(item.id, {
      id: item.id,
      title: item.title || existing?.title || "Counselor update",
      message: item.message || existing?.message || "",
      type: mapInboxType(item.notification_type || item.type || existing?.type || "info"),
      is_read: Boolean(item.is_read ?? existing?.is_read),
      action_url: inboxActionUrl(item.notification_type, item.action_url || existing?.action_url),
      created_at: item.created_at || existing?.created_at || new Date().toISOString(),
      source: existing?.source || "document_notifications",
    });
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function markInboxRead(ids: string[]) {
  if (!ids.length) return;
  await Promise.all([
    supabase.from("notifications").update({ is_read: true }).in("id", ids),
    supabase.from("document_notifications").update({ is_read: true }).in("id", ids),
  ]);
}
