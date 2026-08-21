const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

        return json({ success: true }, 201);
    }
};
