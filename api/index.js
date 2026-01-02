import Fastify from "fastify";
import cors from "@fastify/cors";
import nodemailer from "nodemailer";
import { apiKeyGuard } from "./authHandler.js";

const app = Fastify({ logger: true });

app.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.get("/", async (_, reply) => {
  return reply.send({ message: "API is running 🚀" });
});

const mailTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post(
  "/v1/notifications/email",
  { preHandler: apiKeyGuard },
  async (request, reply) => {
    const { to, subject, text, html } = request.body || {};

    if (!to || !subject || (!text && !html)) {
      return reply.code(400).send({
        error: "Body error. Submit: { to, subject, text or html }",
      });
    }

    try {
      const info = await mailTransport.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
      });

      return reply.code(200).send({
        ok: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      });
    } catch (err) {
      request.log.error({ err }, "Failed to send email");
      return reply.code(500).send({
        ok: false,
        error: "Failed to send email",
        details: err?.message,
      });
    }
  }
);

export default async function handler(req, reply) {
  await app.ready();
  app.server.emit("request", req, reply);
}
