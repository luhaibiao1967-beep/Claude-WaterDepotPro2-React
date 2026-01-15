// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jzdnvdebwmuebjbergsp.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6ZG52ZGVid211ZWJqYmVyZ3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODAxNTksImV4cCI6MjA4Mzg1NjE1OX0.uE2V99SFMeiE3NzzR8aoXDJeUdVuG6jU8ghkib1acrQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
