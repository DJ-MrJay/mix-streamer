import { supabase } from "./supabase";

export async function getMixes() {
  const { data, error } = await supabase
    .from("mixes")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching mixes:", error);
    return [];
  }

  return data;
}
