const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    })[character]);
}

async function sendConfirmationEmail({ name, email }) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey || !from) {
        console.error("Resend environment variables are missing.");
        return false;
    }

    const safeName = escapeHtml(name);
    const text = [
        `Hi ${name},`,
        "",
        "You're registered for Index Ideas.",
        "",
        "September 18, 2026 · 7–9pm",
        "Sparkhouse",
        "Charlotte, NC",
        "",
        "The best thinking. The best thinkers. Happening here.",
        "",
        "We look forward to seeing you."
    ].join("\n");

    const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f2f6ff;color:#213666;font-family:Inter,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">You're registered for Index Ideas in Charlotte.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f6ff;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#213666;border-radius:28px;overflow:hidden;box-shadow:0 20px 60px rgba(33,54,102,.18);">
            <tr>
              <td style="padding:48px 42px 24px;color:#ffcc00;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Index Ideas · Charlotte</td>
            </tr>
            <tr>
              <td style="padding:0 42px;color:#ffffff;font-size:46px;font-weight:300;line-height:1.04;letter-spacing:-2px;">You're in, ${safeName}.</td>
            </tr>
            <tr>
              <td style="padding:24px 42px 34px;color:rgba(255,255,255,.76);font-size:17px;line-height:1.6;">Your registration is confirmed. Join the brightest thinkers in the room for an evening of ideas, conversation, and forward motion.</td>
            </tr>
            <tr>
              <td style="padding:0 42px 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:rgba(39,128,255,.22);border:1px solid rgba(255,255,255,.18);border-radius:18px;">
                  <tr><td style="padding:24px 26px 8px;color:#ffffff;font-size:22px;font-weight:500;">September 18, 2026 · 7–9pm</td></tr>
                  <tr><td style="padding:0 26px 24px;color:rgba(255,255,255,.7);font-size:15px;line-height:1.5;">Sparkhouse<br>Charlotte, NC</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#2780ff;padding:24px 42px;color:#ffffff;font-size:14px;line-height:1.5;">The best thinking. The best thinkers. Happening here.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from,
                to: [email],
                subject: "You're registered for Index Ideas",
                text,
                html
            })
        });

        if (!response.ok) {
            console.error("Resend confirmation failed with status:", response.status);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Resend request failed:", error instanceof Error ? error.message : "Unknown error");
        return false;
    }
}

function json(body, status = 200) {
    return Response.json(body, {
        status,
        headers: {
            "Cache-Control": "no-store"
        }
    });
}

export default {
    async fetch(request) {
        if (request.method !== "POST") {
            return json({ error: "Method not allowed." }, 405);
        }

        const contentLength = Number(request.headers.get("content-length") || 0);
        if (contentLength > 10_000) {
            return json({ error: "Request is too large." }, 413);
        }

        const origin = request.headers.get("origin");
        const host = request.headers.get("x-forwarded-host") || request.headers.get("host");

        if (origin && host) {
            try {
                if (new URL(origin).host !== host) {
                    return json({ error: "Invalid request origin." }, 403);
                }
            } catch {
                return json({ error: "Invalid request origin." }, 403);
            }
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return json({ error: "Invalid request." }, 400);
        }

        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const phone = String(body.phone || "").trim();
        const website = String(body.website || "").trim();

        // Silently accept bot submissions without writing them to the database.
        if (website) {
            return json({ success: true }, 201);
        }

        if (
            name.length < 1 ||
            name.length > 100 ||
            email.length < 3 ||
            email.length > 320 ||
            !EMAIL_PATTERN.test(email) ||
            phone.length < 7 ||
            phone.length > 30
        ) {
            return json({ error: "Please check your registration information." }, 400);
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseSecretKey =
            process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseSecretKey) {
            console.error("Supabase environment variables are missing.");
            return json({ error: "Registration is temporarily unavailable." }, 500);
        }

        const headers = {
            apikey: supabaseSecretKey,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
        };

        // Legacy service_role keys are JWTs and also require Authorization.
        if (supabaseSecretKey.startsWith("eyJ")) {
            headers.Authorization = `Bearer ${supabaseSecretKey}`;
        }

        let supabaseResponse;
        try {
            supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/registrations`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    source: "index-ideas-website"
                })
            });
        } catch (error) {
            console.error("Supabase request failed:", error instanceof Error ? error.message : "Unknown error");
            return json({ error: "Registration could not be completed." }, 502);
        }

        if (!supabaseResponse.ok) {
            console.error("Supabase registration failed with status:", supabaseResponse.status);
            return json({ error: "Registration could not be completed." }, 502);
        }

        const emailSent = await sendConfirmationEmail({ name, email });

        return json({ success: true, emailSent }, 201);
    }
};
