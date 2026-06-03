import { Resend } from "resend";
import { welcomeTemplate } from "@/lib/email-templates/welcome";
import { limitReachedTemplate } from "@/lib/email-templates/limit-reached";
import { proActivationTemplate } from "@/lib/email-templates/pro-activation";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "Feedback Analyzer <onboarding@resend.dev>";

export async function sendWelcomeEmail(to: string): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Bienvenido a Feedback Analyzer",
      html: welcomeTemplate(),
    });
  } catch (err) {
    console.warn("[email] sendWelcomeEmail failed:", err);
  }
}

export async function sendLimitReachedEmail(to: string, checkoutUrl: string): Promise<void> {
  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: "Has alcanzado el límite gratuito — actualiza a Pro",
      html: limitReachedTemplate({ checkoutUrl }),
    });
    console.log("[email] sendLimitReachedEmail sent to:", to, "result:", result);
  } catch (err) {
    console.warn("[email] sendLimitReachedEmail failed:", err);
  }
}

export async function sendProActivationEmail(to: string): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "¡Tu plan Pro está activo!",
      html: proActivationTemplate(),
    });
  } catch (err) {
    console.warn("[email] sendProActivationEmail failed:", err);
  }
}
