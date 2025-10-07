import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KYCNotificationRequest {
  user_email: string;
  user_name: string;
  status: 'submitted' | 'approved' | 'rejected';
  message?: string;
  rejection_reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_email, 
      user_name, 
      status,
      message,
      rejection_reason 
    }: KYCNotificationRequest = await req.json();

    console.log('Sending KYC notification:', { user_email, user_name, status });

    let subject: string;
    let html: string;

    if (status === 'submitted') {
      subject = "KYC Documents Received - Community Reserve";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Community Reserve</h1>
          </div>
          
          <div style="padding: 40px 30px; background-color: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0;">KYC Documents Received</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Dear ${user_name},
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thank you for submitting your KYC verification documents. We have successfully received your documents and they are now under review.
            </p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0;">
              <p style="color: #92400e; margin: 0; font-weight: 500;">
                ⏰ Review Timeline: Within 24 hours
              </p>
            </div>
            
            <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">What happens next?</h3>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>Our team will carefully review your submitted documents</li>
                <li>You'll receive an email notification within 24 hours</li>
                <li>Once approved, you'll have full access to your account</li>
              </ul>
            </div>
            
            ${message ? `
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
            ` : ''}
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              If you have any questions, please don't hesitate to contact our support team.
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Best regards,<br>
              <strong>The Community Reserve Team</strong>
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">© 2025 Community Reserve. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Secure Digital Banking Platform</p>
          </div>
        </div>
      `;
    } else if (status === 'approved') {
      subject = "KYC Verification Approved - Account Activated! 🎉";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Community Reserve</h1>
          </div>
          
          <div style="padding: 40px 30px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #10b981; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 40px;">✓</span>
              </div>
            </div>
            
            <h2 style="color: #1f2937; margin-top: 0; text-align: center;">KYC Verification Approved!</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Dear ${user_name},
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Great news! Your KYC verification has been approved and your account is now fully activated.
            </p>
            
            <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0;">
              <p style="color: #065f46; margin: 0; font-weight: 500;">
                ✓ Account Status: Approved & Active
              </p>
            </div>
            
            <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">You can now:</h3>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>Make deposits to your account</li>
                <li>Request withdrawals</li>
                <li>Transfer funds to other accounts</li>
                <li>Access all banking features</li>
              </ul>
            </div>
            
            ${message ? `
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://your-app.lovable.app'}" 
                 style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Access Your Dashboard
              </a>
            </div>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thank you for choosing Community Reserve!
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Best regards,<br>
              <strong>The Community Reserve Team</strong>
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">© 2025 Community Reserve. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Secure Digital Banking Platform</p>
          </div>
        </div>
      `;
    } else { // rejected
      subject = "KYC Verification Update - Community Reserve";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Community Reserve</h1>
          </div>
          
          <div style="padding: 40px 30px; background-color: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0;">KYC Verification Update</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Dear ${user_name},
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thank you for submitting your KYC documents. Unfortunately, we were unable to approve your verification at this time.
            </p>
            
            ${rejection_reason ? `
              <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 25px 0;">
                <p style="color: #991b1b; margin: 0; font-weight: 500;">
                  Reason: ${rejection_reason}
                </p>
              </div>
            ` : ''}
            
            <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Next Steps:</h3>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>Review the feedback provided above</li>
                <li>Prepare new documents if needed</li>
                <li>Submit updated documents through your account</li>
                <li>Contact support if you need assistance</li>
              </ul>
            </div>
            
            ${message ? `
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
            ` : ''}
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              If you have any questions or need clarification, please contact our support team at support@communityreserve.com
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Best regards,<br>
              <strong>The Community Reserve Team</strong>
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">© 2025 Community Reserve. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">Secure Digital Banking Platform</p>
          </div>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Community Reserve <onboarding@resend.dev>",
      to: [user_email],
      subject: subject,
      html: html,
    });

    console.log("KYC email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-kyc-notification function:", error);
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
