import type { FastifyInstance } from 'fastify';
import { renderEmail } from './templates/base.template';
import { EMAIL_SAMPLES, findSample } from './templates/preview-samples';

/**
 * Dev-only browser preview for the email templates.
 *
 *   GET /dev/emails            index of every template
 *   GET /dev/emails/:key       the rendered email, exactly as sent
 *   GET /dev/emails/:key?dark=1  forces the dark-mode palette on
 *   GET /dev/emails/:key?text=1  the plaintext part
 *
 * Registered from main.ts and only outside production — these routes are
 * unauthenticated, so they must never exist on a public server.
 *
 * Renders through the same renderEmail() the mailer uses, against the shared
 * fixtures in preview-samples.ts, so the preview cannot drift from what
 * actually gets delivered.
 */
export function registerEmailPreview(fastify: FastifyInstance) {
  fastify.get('/dev/emails', async (_req, reply) => {
    const rows = EMAIL_SAMPLES.map(
      (s) => `
      <tr>
        <td><a href="/dev/emails/${s.key}">${s.name}</a></td>
        <td><code>${s.trigger}</code></td>
        <td class="a">
          <a href="/dev/emails/${s.key}">light</a> ·
          <a href="/dev/emails/${s.key}?dark=1">dark</a> ·
          <a href="/dev/emails/${s.key}?text=1">text</a>
        </td>
      </tr>`,
    ).join('');

    reply.type('text/html').send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Email templates</title>
<style>
  body{font:15px/1.6 ui-sans-serif,system-ui,'Segoe UI',Roboto,sans-serif;
       max-width:900px;margin:48px auto;padding:0 24px;color:#414e55;background:#f6f6f7}
  h1{color:#172730;font-size:26px;margin:0 0 6px}
  p.lede{margin:0 0 28px;color:#828a8f}
  table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e1e3e4;border-radius:10px;overflow:hidden}
  th,td{padding:12px 16px;text-align:left;border-bottom:1px solid #eceeee;vertical-align:top}
  th{background:#fafbfb;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#828a8f}
  tr:last-child td{border-bottom:0}
  a{color:#3e63b8}
  code{font:12px ui-monospace,Menlo,monospace;color:#667076;background:#f6f6f7;
       padding:2px 6px;border-radius:4px}
  td.a{white-space:nowrap;font-size:13px}
  .note{margin-top:24px;padding:14px 18px;background:#fff;border-left:3px solid #b8912f;
        border-radius:6px;font-size:14px}
</style></head><body>
  <h1>Email templates</h1>
  <p class="lede">Rendered by the same code that sends them. Dev only.</p>
  <table>
    <tr><th>Template</th><th>Sent by</th><th>View</th></tr>
    ${rows}
  </table>
  <div class="note">
    To check one in a real inbox — where Gmail and Outlook strip things a browser keeps —
    run <code>npm run mail:test -- you@example.com &lt;key&gt;</code>.
  </div>
</body></html>`);
  });

  fastify.get<{
    Params: { key: string };
    Querystring: { dark?: string; text?: string };
  }>('/dev/emails/:key', async (req, reply) => {
    const sample = findSample(req.params.key);
    if (!sample) {
      reply
        .code(404)
        .type('text/html')
        .send(
          `<p>No template "${req.params.key}". <a href="/dev/emails">Back to the list</a>.</p>`,
        );
      return;
    }

    const { html, text } = renderEmail(sample.template);

    if (req.query.text) {
      reply.type('text/plain').send(text);
      return;
    }

    // The dark palette sits behind prefers-color-scheme, which follows the OS
    // and ignores a query param — forcing the query on is the only way to
    // preview it without changing system settings.
    reply
      .type('text/html')
      .send(
        req.query.dark
          ? html.replace('@media (prefers-color-scheme: dark)', '@media all')
          : html,
      );
  });
}
