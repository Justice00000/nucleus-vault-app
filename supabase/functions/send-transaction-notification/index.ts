import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TransactionNotificationRequest {
  user_email: string;
  user_name: string;
  transaction_type: string;
  amount: number;
  status: string;
  description?: string;
  account_number?: string;
  external_account?: string;
  transaction_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      user_email,
      user_name,
      transaction_type,
      amount,
      status,
      description,
      account_number,
      external_account,
      transaction_id,
    }: TransactionNotificationRequest = await req.json();

    console.log("Sending transaction notification:", {
      user_email,
      transaction_type,
      status,
    });

    // Format amount as currency
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    // Determine email subject and content based on transaction type and status
    let subject = "";
    let emailContent = "";

    const typeText =
      transaction_type === "deposit"
        ? "Deposit"
        : transaction_type === "withdrawal"
        ? "Withdrawal"
        : "Transfer";

    switch (status) {
      case "pending":
        subject = `${typeText} Request Received - ${formattedAmount}`;
        emailContent = `
          <h2>Transaction Request Received</h2>
          <p>Dear ${user_name},</p>
          <p>We have received your ${transaction_type} request for ${formattedAmount}.</p>
          ${description ? `<p><strong>Description:</strong> ${description}</p>` : ""}
          ${external_account ? `<p><strong>To Account:</strong> ${external_account}</p>` : ""}
          <p><strong>Status:</strong> Pending Review</p>
          <p>Our team is reviewing your transaction and will process it shortly. You will receive another email once the transaction is approved or if any additional information is needed.</p>
          <p><strong>Transaction ID:</strong> ${transaction_id}</p>
        `;
        break;

      case "approved":
        subject = `${typeText} Approved - ${formattedAmount}`;
        emailContent = `
          <h2>Transaction Approved</h2>
          <p>Dear ${user_name},</p>
          <p>Great news! Your ${transaction_type} for ${formattedAmount} has been approved and processed.</p>
          ${description ? `<p><strong>Description:</strong> ${description}</p>` : ""}
          ${external_account ? `<p><strong>To Account:</strong> ${external_account}</p>` : ""}
          ${account_number ? `<p><strong>From Account:</strong> ${account_number}</p>` : ""}
          <p><strong>Status:</strong> Completed</p>
          <p>The funds have been processed and your account balance has been updated accordingly.</p>
          <p><strong>Transaction ID:</strong> ${transaction_id}</p>
        `;
        break;

      case "declined":
        subject = `${typeText} Declined - ${formattedAmount}`;
        emailContent = `
          <h2>Transaction Declined</h2>
          <p>Dear ${user_name},</p>
          <p>We regret to inform you that your ${transaction_type} request for ${formattedAmount} has been declined.</p>
          ${description ? `<p><strong>Description:</strong> ${description}</p>` : ""}
          <p><strong>Status:</strong> Declined</p>
          <p>If you have questions about this decision or would like more information, please contact our support team.</p>
          <p><strong>Transaction ID:</strong> ${transaction_id}</p>
        `;
        break;

      case "delayed":
        subject = `${typeText} Delayed - ${formattedAmount}`;
        emailContent = `
          <h2>Transaction Delayed</h2>
          <p>Dear ${user_name},</p>
          <p>Your ${transaction_type} for ${formattedAmount} is experiencing a delay.</p>
          ${description ? `<p><strong>Description:</strong> ${description}</p>` : ""}
          <p><strong>Status:</strong> Delayed</p>
          <p>We are working to resolve this issue and will notify you once the transaction is processed or if we need additional information from you.</p>
          <p><strong>Transaction ID:</strong> ${transaction_id}</p>
        `;
        break;

      default:
        subject = `Transaction Update - ${formattedAmount}`;
        emailContent = `
          <h2>Transaction Update</h2>
          <p>Dear ${user_name},</p>
          <p>There has been an update to your ${transaction_type} for ${formattedAmount}.</p>
          ${description ? `<p><strong>Description:</strong> ${description}</p>` : ""}
          <p><strong>Status:</strong> ${status}</p>
          <p><strong>Transaction ID:</strong> ${transaction_id}</p>
        `;
    }

    // Send email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Community Reserve <notifications@resend.dev>",
      to: [user_email],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              h2 {
                color: #2563eb;
                border-bottom: 2px solid #2563eb;
                padding-bottom: 10px;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 0.875rem;
                color: #6b7280;
              }
              .amount {
                font-size: 1.5rem;
                font-weight: bold;
                color: #2563eb;
              }
            </style>
          </head>
          <body>
            ${emailContent}
            <div class="footer">
              <p>This is an automated notification from Community Reserve. Please do not reply to this email.</p>
              <p>If you did not initiate this transaction or have concerns about your account security, please contact us immediately.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
    } else {
      console.log("Email sent successfully:", emailData);
    }

    // Log notification in database
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        type: "transaction",
        title: subject,
        message: `${typeText} of ${formattedAmount} - Status: ${status}`,
        email_sent: !emailError,
      });

    if (notificationError) {
      console.error("Error logging notification:", notificationError);
    }

    return new Response(
      JSON.stringify({ success: true, email_sent: !emailError }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-transaction-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
