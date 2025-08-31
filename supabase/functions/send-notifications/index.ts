import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_id: string;
  type: string;
  title: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, type, title, message }: NotificationRequest = await req.json();

    console.log("Creating notification:", { user_id, type, title, message });

    // Create notification in database
    const { data, error } = await supabaseClient
      .from("notifications")
      .insert([{
        user_id,
        type,
        title,
        message,
        is_read: false,
        email_sent: false
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      throw error;
    }

    console.log("Notification created successfully:", data);

    return new Response(
      JSON.stringify({ success: true, notification: data }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);