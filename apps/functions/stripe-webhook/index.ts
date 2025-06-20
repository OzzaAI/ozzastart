// Stub handler for Stripe webhooks
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

serve(async (req) => {
  const body = await req.json();
  console.log("Stripe webhook received:", body);
  return new Response("OK", { headers: { "Content-Type": "text/plain" } });
}); 