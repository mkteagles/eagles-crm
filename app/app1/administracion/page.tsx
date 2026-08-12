import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdministrationDashboard from "@/components/AdministrationDashboard";

export default async function AdministrationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/app1");
  }

  return (
    <AdministrationDashboard
      user={{
        id: profile.id,
        full_name: profile.full_name,
        role: profile.role,
      }}
    />
  );
}