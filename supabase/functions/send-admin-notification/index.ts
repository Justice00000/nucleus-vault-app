import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_email: string;
  subject: string;
  message: string;
  action_type: 'user_status' | 'transaction' | 'kyc';
  details?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_email, subject, message, action_type, details }: NotificationRequest = await req.json();

    console.log("Sending admin notification email:", { user_email, subject, action_type });

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Banking System <onboarding@resend.dev>",
      to: [user_email],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Account Update Notification
          </h1>
          <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.5;">${message}</p>
            ${details ? `<div style="margin-top: 15px; padding: 10px; background-color: #e9ecef; border-radius: 3px;">
              <strong>Details:</strong>
              <pre style="margin: 5px 0; font-size: 14px;">${JSON.stringify(details, null, 2)}</pre>
            </div>` : ''}
          </div>
          <p style="color: #666; font-size: 14px;">
            This is an automated notification from your banking system. 
            Please log in to your account to view the latest updates.
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; font-size: 12px;">
            <p>© 2024 Banking System. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      throw emailResponse.error;
    }

    console.log("Email sent successfully:", emailResponse.data);

    // Also create a notification record in the database
    const { error: notificationError } = await supabaseClient
      .from("notifications")
      .insert([{
        user_id: null, // We'll need to get user_id from email if needed
        type: action_type,
        title: subject,
        message: message,
        is_read: false,
        email_sent: true
      }]);

    if (notificationError) {
      console.error("Error creating notification record:", notificationError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailResponse.data?.id,
        message: "Notification sent successfully" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-admin-notification function:", error);
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