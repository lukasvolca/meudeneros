import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jqwqwupqqyfyagmavido.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxd3F3dXBxcXlmeWFnbWF2aWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTQ0MTEsImV4cCI6MjA5MzY3MDQxMX0.jFGhtIUB7t_c_-k5SOMRSJajBLjVx4agCvt0g2RbJFY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
