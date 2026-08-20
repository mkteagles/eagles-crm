import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TallerDashboard from "@/components/TallerDashboard";

export default async function TallerPage() {
  const supabase = await createClient();

  // =========================================================
  // USUARIO AUTENTICADO
  // =========================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // =========================================================
  // ACCESO AL TALLER
  //
  // NO usamos user_profiles.role
  //
  // El acceso depende exclusivamente de:
  // taller_user_access
  // =========================================================

  const { data: tallerAccess, error } = await supabase
    .from("taller_user_access")
    .select("access_level, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  // =========================================================
  // DEBUG
  // =========================================================

  console.log("TALLER ACCESS:", {
    userId: user.id,
    email: user.email,
    tallerAccess,
    error,
  });

  // =========================================================
  // SIN ACCESO
  // =========================================================

  if (!tallerAccess) {
    redirect("/app1");
  }

  // =========================================================
  // TALLER
  // =========================================================

  return (
    <TallerDashboard
      accessLevel={tallerAccess.access_level}
      userId={user.id}
      userEmail={user.email ?? ""}
    />
  );
}