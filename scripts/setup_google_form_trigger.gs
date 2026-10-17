/**
 * ============================================================================
 * NABIN TAMRAKAR — WEBSITE CONTACT FORM AUTOMATION ENGINE
 * Author: Aaradhya Dev Tamrakar
 * Repository: https://github.com/nabintmr/nabintmr.github.io
 * 
 * 1. Open https://script.google.com under Nabin's Google Account (nabintmr@gmail.com).
 * 2. Paste this entire script into the editor.
 * 3. Select `setupNabinContactForm` from the function dropdown and click "Run".
 * 4. Grant Google Permissions when prompted (one-time authorization).
 * 5. Check the "Execution log" at the bottom for the exact config to paste into
 *    `assets/js/script.js`!
 * ============================================================================
 */

const NOTIFICATION_EMAIL = "nabintmr@gmail.com";
const SENDER_NAME = "Nabin Tamrakar";
const PHONE_NUMBER = "+977 984-2649491";
const WEBSITE_URL = "https://nabintmr.github.io";

function setupNabinContactForm() {
  Logger.log("Creating new Google Form for Nabin Tamrakar Contact Intake...");
  
  // 1. Create the Form
  const form = FormApp.create("Nabin Tamrakar — Website Contact Submissions");
  form.setDescription("Official contact intake form for https://nabintmr.github.io");
  form.setAllowResponseEdits(false);
  form.setCollectEmail(false); // Collected via custom form field
  
  // 2. Add Questions (Name, Phone, Email, Message)
  const nameItem = form.addTextItem().setTitle("Name").setRequired(true);
  const phoneItem = form.addTextItem().setTitle("Phone").setRequired(true);
  const emailItem = form.addTextItem().setTitle("Email").setRequired(false);
  const messageItem = form.addParagraphTextItem().setTitle("Message").setRequired(true);
  
  // 3. Extract exact entry IDs via dummy pre-filled response
  const dummyResponse = form.createResponse();
  dummyResponse.withItemResponse(nameItem.createResponse("NAME_PLACEHOLDER"));
  dummyResponse.withItemResponse(phoneItem.createResponse("PHONE_PLACEHOLDER"));
  dummyResponse.withItemResponse(emailItem.createResponse("EMAIL_PLACEHOLDER"));
  dummyResponse.withItemResponse(messageItem.createResponse("MESSAGE_PLACEHOLDER"));
  
  const prefilledUrl = dummyResponse.toPrefilledUrl();
  
  // Parse entry IDs from prefilled URL query parameters
  const extractEntryId = (url, placeholder) => {
    const match = url.match(new RegExp(`(entry\\.\\d+)=${placeholder}`));
    return match ? match[1] : null;
  };
  
  const nameEntry = extractEntryId(prefilledUrl, "NAME_PLACEHOLDER") || `entry.${nameItem.getId()}`;
  const phoneEntry = extractEntryId(prefilledUrl, "PHONE_PLACEHOLDER") || `entry.${phoneItem.getId()}`;
  const emailEntry = extractEntryId(prefilledUrl, "EMAIL_PLACEHOLDER") || `entry.${emailItem.getId()}`;
  const messageEntry = extractEntryId(prefilledUrl, "MESSAGE_PLACEHOLDER") || `entry.${messageItem.getId()}`;
  
  // Construct the headless POST URL
  const formUrl = form.getPublishedUrl();
  const actionUrl = formUrl.replace(/viewform.*/, "formResponse");
  
  // 4. Create or link a Google Spreadsheet to store responses
  const ss = SpreadsheetApp.create("Nabin Tamrakar — Contact Messages (Ledger)");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  
  // 5. Register onFormSubmit Trigger automatically
  ScriptApp.newTrigger("handleFormSubmit")
    .forForm(form)
    .onFormSubmit()
    .create();
    
  // 6. Print formatted configuration for the website
  Logger.log("\n========================================================");
  Logger.log("🎉 SUCCESS! GOOGLE FORM CREATED & CONFIGURED AUTOMATICALLY");
  Logger.log("========================================================");
  Logger.log(`Form Edit URL: ${form.getEditUrl()}`);
  Logger.log(`Spreadsheet Ledger: ${ss.getUrl()}`);
  Logger.log("--------------------------------------------------------");
  Logger.log("COPY AND PASTE THIS INTO assets/js/script.js:\n");
  
  const configSnippet = `var GOOGLE_FORM = {
  actionUrl: '${actionUrl}',
  entries: {
    name: '${nameEntry}',
    phone: '${phoneEntry}',
    email: '${emailEntry}',
    message: '${messageEntry}',
  },
  enabled: true,
};`;
  
  Logger.log(configSnippet);
  Logger.log("========================================================\n");
}


/**
 * TRIGGER FUNCTION: Executes on every submission
 * 1. Sends instant email notification to Nabin Tamrakar (nabintmr@gmail.com).
 * 2. If visitor provided an email, sends a confirmation receipt.
 */
function handleFormSubmit(e) {
  if (!e || !e.response) return;
  
  const itemResponses = e.response.getItemResponses();
  let name = "Visitor";
  let phone = "Not provided";
  let email = "";
  let message = "";
  
  itemResponses.forEach(res => {
    const title = res.getItem().getTitle().toLowerCase().trim();
    const val = res.getResponse();
    if (title === "name") name = val;
    else if (title === "phone") phone = val;
    else if (title === "email") email = val;
    else if (title === "message") message = val;
  });

  const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" });

  // ── 1. Notification to Nabin Tamrakar ─────────────────────────────
  const alertSubject = `[Website Contact] New Inquiry from ${name} (${phone})`;
  const alertBody = 
`You received a new inquiry from ${WEBSITE_URL}

From: ${name}
Phone: ${phone}
Email: ${email || "Not provided"}
Time (Nepal): ${nowStr}

Message:
--------------------------------------------------
${message}
--------------------------------------------------

* WhatsApp Quick Link: https://wa.me/${phone.replace(/[^0-9]/g, "")}
${email ? `* Reply directly to this email to respond to ${name}.` : ""}`;

  const mailOptions = {
    name: "Website Contact Notification",
  };
  if (email && email.includes("@")) {
    mailOptions.replyTo = email;
  }

  GmailApp.sendEmail(NOTIFICATION_EMAIL, alertSubject, alertBody, mailOptions);

  // ── 2. Auto-Reply to the Visitor (if email provided) ─────────────
  if (email && email.includes("@")) {
    const receiptSubject = `Thank you for reaching out — Nabin Tamrakar`;
    const receiptHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; color: #1e1e1e; line-height: 1.6;">
        <h2 style="color: #0d2238; font-size: 1.25rem; margin-bottom: 0.5rem;">Message Received / सन्देश प्राप्त भयो</h2>
        <p>Namaste <strong>${name}</strong>,</p>
        <p>Thank you for getting in touch through my website. I have received your message and will respond shortly.</p>
        <p style="color: #555; font-size: 0.95rem;">तपाईंको सन्देश प्राप्त भएको छ। म छिट्टै तपाईंसँग सम्पर्क गर्नेछु।</p>
        
        <div style="background: #f7f9fb; border-left: 3px solid #25D366; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #667085; margin-bottom: 6px; font-weight: 600;">Your Message / तपाईंको सन्देश</div>
          <div style="white-space: pre-wrap; font-size: 0.92rem; color: #1f2937;">${message}</div>
        </div>
        
        <p style="margin-top: 20px; font-size: 0.9rem; color: #475467;">
          Need an immediate response? You can also message me directly on WhatsApp at 
          <a href="https://wa.me/9779842649491" style="color: #128C7E; font-weight: 600;">+977 984-2649491</a>.
        </p>
        
        <p style="margin-top: 24px; margin-bottom: 0;">Warm regards / हार्दिक शुभकामना,</p>
        <p style="margin: 0; line-height: 1.4;">
          <strong>Nabin Tamrakar</strong><br>
          <span style="font-size: 0.85rem; color: #666;">Insurance · Community · Share Market</span><br>
          <a href="${WEBSITE_URL}" style="color: #0d2238; text-decoration: none; font-size: 0.85rem;">${WEBSITE_URL}</a>
        </p>
      </div>
    `;

    GmailApp.sendEmail(email, receiptSubject, "", {
      name: SENDER_NAME,
      htmlBody: receiptHtml,
      replyTo: NOTIFICATION_EMAIL
    });
  }
}
