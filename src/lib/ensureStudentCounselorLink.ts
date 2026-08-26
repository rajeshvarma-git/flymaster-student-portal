import type { User } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";

export async function ensureStudentCounselorLink(user: User) {
  if (!user.email) return;

  const { data: counselor } = await supabase
    .from("counselors")
    .select("user_id")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let counselorId = counselor?.user_id as string | undefined;

  if (!counselorId) {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "counselor")
      .limit(1)
      .maybeSingle();
    counselorId = roleRow?.user_id;
  }

  if (!counselorId) return;

  const { data: existingRows } = await supabase
    .from("student_leads")
    .select("id, assigned_counselor_id")
    .eq("user_id", user.id);

  const existing = (existingRows || [])[0];

  if (existing) {
    if (!existing.assigned_counselor_id) {
      await supabase
        .from("student_leads")
        .update({ assigned_counselor_id: counselorId, status: "assigned", entity_type: "student" })
        .eq("id", existing.id);
    }
    return;
  }

  await supabase.from("student_leads").insert({
    user_id: user.id,
    email: user.email,
    first_name: (user.user_metadata?.first_name as string) || null,
    last_name: (user.user_metadata?.last_name as string) || null,
    assigned_counselor_id: counselorId,
    lead_source: "student_site",
    status: "assigned",
    entity_type: "student",
  });
}
