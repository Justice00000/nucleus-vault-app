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

    // Format transaction details nicely
    const formatTransactionDetails = (details: any) => {
      if (!details) return '';
      
      let detailsHtml = '';
      
      if (details.transaction_id) {
        detailsHtml += `
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; margin: 20px 0; color: white; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Transaction Details</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 16px;">
              <div style="flex: 1; min-width: 200px;">
                <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                  <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">Transaction ID</div>
                  <div style="font-weight: 600; font-family: monospace; font-size: 13px;">${details.transaction_id}</div>
                </div>
                ${details.amount ? `
                <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                  <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">Amount</div>
                  <div style="font-weight: 600; font-size: 20px;">$${Number(details.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
                ` : ''}
              </div>
              <div style="flex: 1; min-width: 200px;">
                ${details.type ? `
                <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                  <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">Transaction Type</div>
                  <div style="font-weight: 600; text-transform: capitalize;">${details.type}</div>
                </div>
                ` : ''}
                ${details.status ? `
                <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px;">
                  <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">Status</div>
                  <div style="font-weight: 600; text-transform: uppercase; color: ${details.status === 'approved' ? '#10b981' : details.status === 'declined' ? '#ef4444' : '#f59e0b'};">${details.status}</div>
                </div>
                ` : ''}
              </div>
            </div>
            ${details.processed_by ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 12px; opacity: 0.8;">
              Processed by: ${details.processed_by}
            </div>
            ` : ''}
          </div>
        `;
      } else {
        // Fallback for other details
        detailsHtml = `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600;">Additional Information</h4>
            <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">
              ${Object.entries(details).map(([key, value]) => 
                `<div style="margin-bottom: 8px;"><strong>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${value}</div>`
              ).join('')}
            </div>
          </div>
        `;
      }
      
      return detailsHtml;
    };

    // Get status color and icon
    const getStatusInfo = (action_type: string, details?: any) => {
      if (action_type === 'transaction') {
        if (details?.status === 'approved') {
          return { color: '#10b981', icon: '✅', bgColor: '#ecfdf5' };
        } else if (details?.status === 'declined') {
          return { color: '#ef4444', icon: '❌', bgColor: '#fef2f2' };
        }
        return { color: '#f59e0b', icon: '⏳', bgColor: '#fffbeb' };
      } else if (action_type === 'user_status') {
        return { color: '#3b82f6', icon: '👤', bgColor: '#eff6ff' };
      } else if (action_type === 'kyc') {
        return { color: '#8b5cf6', icon: '📋', bgColor: '#f5f3ff' };
      }
      return { color: '#6b7280', icon: '📢', bgColor: '#f9fafb' };
    };

    const statusInfo = getStatusInfo(action_type, details);

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "FinTech Pro <onboarding@resend.dev>",
      to: [user_email],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); margin-top: 32px; margin-bottom: 32px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                ${statusInfo.icon} FinTech Pro
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Your trusted banking partner
              </p>
            </div>

            <!-- Status Badge -->
            <div style="padding: 24px 24px 16px 24px;">
              <div style="background-color: ${statusInfo.bgColor}; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 24px; margin-bottom: 8px;">${statusInfo.icon}</div>
                <h2 style="margin: 0; color: ${statusInfo.color}; font-size: 20px; font-weight: 600;">
                  ${subject.replace(/^(Transaction|User|KYC)\s*-?\s*/, '')}
                </h2>
              </div>
            </div>

            <!-- Content -->
            <div style="padding: 0 24px 24px 24px;">
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid ${statusInfo.color};">
                <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">
                  ${message}
                </p>
              </div>

              ${formatTransactionDetails(details)}

              <!-- Call to Action -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="#" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.2s;">
                  View Account Dashboard
                </a>
              </div>

              <!-- Info Note -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                  <div style="font-size: 18px; line-height: 1;">ℹ️</div>
                  <div>
                    <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 600; margin-bottom: 4px;">
                      Important Information
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #3730a3; line-height: 1.4;">
                      This is an automated notification from FinTech Pro. Please log in to your account to view the complete details and manage your banking preferences.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                © 2024 FinTech Pro. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                This email was sent to ${user_email}. If you have questions, please contact our support team.
              </p>
            </div>

          </div>
        </body>
        </html>
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