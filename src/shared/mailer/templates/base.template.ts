import {
  BRAND,
  EMAIL_MAX_WIDTH,
  FONT_STACK,
  LOGO_URL,
} from '../mailer.constants';
import { WEBSITE_NAME, WEBSITE_URL } from 'src/common/constants';

export type InfoTone = 'info' | 'warn' | 'danger' | 'success';

export interface EmailButton {
  label: string;
  url: string;
}

export interface EmailInfoBox {
  text: string;
  tone?: InfoTone;
  /** Optional bold lead-in, e.g. "Heads up". */
  label?: string;
}

export interface EmailTemplateOptions {
  /** Hidden inbox preview line. Falls back to the first paragraph. */
  preheader?: string;
  /** Main title inside the card. */
  heading: string;
  /** e.g. "Hi Ahmed," */
  greeting?: string;
  /**
   * Body paragraphs, rendered in order. Treated as trusted HTML so callers can
   * use <b>/<a>; run untrusted values (names, user input) through escapeHtml().
   */
  paragraphs?: string[];
  button?: EmailButton;
  /** Render the button URL as copy-paste text below it. Default: true when a button exists. */
  showLinkFallback?: boolean;
  infoBox?: EmailInfoBox;
  /** Small print shown above the footer. */
  footnote?: string;
}

/** Escape untrusted values before interpolating them into template strings. */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const TONES: Record<InfoTone, { bg: string; border: string; ink: string }> = {
  info: { bg: BRAND.surface, border: BRAND.primary, ink: BRAND.body },
  warn: { bg: BRAND.warnBg, border: BRAND.warnBorder, ink: BRAND.warnInk },
  danger: {
    bg: BRAND.dangerBg,
    border: BRAND.dangerBorder,
    ink: BRAND.dangerInk,
  },
  success: {
    bg: BRAND.successBg,
    border: BRAND.successBorder,
    ink: BRAND.successInk,
  },
};

/**
 * Strip tags for the auto-generated plaintext part, keeping link targets —
 * otherwise a text-only client would show clickable words with no URL to act on.
 */
const toPlain = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(
      /<a\b[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi,
      (_m, href: string, label: string) => `${label} (${href})`,
    )
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

/**
 * Render a branded email.
 *
 * Built for real mail clients, not browsers: table layout, inlined styles, a
 * VML fallback so the button keeps its shape in Outlook, and a dark-mode block
 * for clients that honour prefers-color-scheme.
 *
 * Returns both HTML and an auto-derived plaintext part, so callers never have
 * to write the copy twice.
 */
export function renderEmail(opts: EmailTemplateOptions): {
  html: string;
  text: string;
} {
  const {
    heading,
    greeting,
    paragraphs = [],
    button,
    showLinkFallback = Boolean(button),
    infoBox,
    footnote,
    preheader,
  } = opts;

  const year = new Date().getFullYear();
  const preview = preheader ?? (paragraphs[0] ? toPlain(paragraphs[0]) : heading);

  const greetingHtml = greeting
    ? `<p style="margin:0 0 16px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${BRAND.body};">${greeting}</p>`
    : '';

  const paragraphsHtml = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${BRAND.body};">${p}</p>`,
    )
    .join('');

  // Bulletproof button: VML for Outlook, padded anchor everywhere else.
  const buttonHtml = button
    ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
          <tr>
            <td align="center" bgcolor="${BRAND.ink}" style="border-radius:8px;">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                href="${button.url}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="17%"
                stroke="f" fillcolor="${BRAND.ink}">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:${FONT_STACK};font-size:15px;font-weight:600;">${escapeHtml(button.label)}</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-- -->
              <a href="${button.url}"
                 style="display:inline-block;padding:14px 32px;font-family:${FONT_STACK};font-size:15px;font-weight:600;
                        color:#ffffff;text-decoration:none;border-radius:8px;background-color:${BRAND.ink};">
                ${escapeHtml(button.label)}
              </a>
              <!--<![endif]-->
            </td>
          </tr>
        </table>`
    : '';

  const linkFallbackHtml =
    showLinkFallback && button
      ? `
        <p style="margin:16px 0 0;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${BRAND.muted};">
          Button not working? Paste this link into your browser:<br />
          <a href="${button.url}" style="color:${BRAND.primary};text-decoration:underline;word-break:break-all;">${button.url}</a>
        </p>`
      : '';

  const infoBoxHtml = infoBox
    ? (() => {
        const tone = TONES[infoBox.tone ?? 'info'];
        const label = infoBox.label
          ? `<strong style="color:${tone.ink};">${escapeHtml(infoBox.label)}</strong> `
          : '';
        return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;">
          <tr>
            <td style="background-color:${tone.bg};border-left:3px solid ${tone.border};border-radius:4px;padding:14px 18px;">
              <p style="margin:0;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:${tone.ink};">${label}${infoBox.text}</p>
            </td>
          </tr>
        </table>`;
      })()
    : '';

  const footnoteHtml = footnote
    ? `
        <tr>
          <td style="padding:0 40px 8px;">
            <p style="margin:0;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${BRAND.muted};">${footnote}</p>
          </td>
        </tr>`
    : '';

  const html = `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(heading)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body { margin:0; padding:0; width:100% !important; -webkit-font-smoothing:antialiased; }
    table { border-collapse:collapse; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    a { color:${BRAND.primary}; }

    @media only screen and (max-width:620px) {
      .sm-px { padding-left:24px !important; padding-right:24px !important; }
      .sm-full { width:100% !important; }
      .sm-h1 { font-size:22px !important; }
    }

    @media (prefers-color-scheme: dark) {
      .dm-page { background-color:#101a20 !important; }
      .dm-card { background-color:#18242b !important; border-color:#243138 !important; }
      .dm-heading { color:#ffffff !important; }
      .dm-text { color:#c5c9cb !important; }
      .dm-muted { color:#90979c !important; }
      .dm-hairline { border-color:#243138 !important; }
      .dm-btn { background-color:${BRAND.gold} !important; }
      .dm-btn a { background-color:${BRAND.gold} !important; color:#101a20 !important; }
    }
  </style>
</head>
<body class="dm-page" style="margin:0;padding:0;background-color:${BRAND.surface};">
  <!-- inbox preview text, hidden in the body -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preview)}</div>
  <div style="display:none;max-height:0;overflow:hidden;">&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="dm-page" style="background-color:${BRAND.surface};">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${EMAIL_MAX_WIDTH}" class="sm-full dm-card"
               style="width:${EMAIL_MAX_WIDTH}px;max-width:${EMAIL_MAX_WIDTH}px;background-color:${BRAND.white};
                      border:1px solid ${BRAND.border};border-radius:14px;overflow:hidden;">

          <!-- gold accent stripe -->
          <tr><td style="height:4px;background-color:${BRAND.gold};line-height:4px;font-size:0;">&nbsp;</td></tr>

          <!-- header -->
          <tr>
            <td align="center" style="background-color:${BRAND.ink};padding:28px 24px;">
              <img src="${LOGO_URL}" width="44" alt="${escapeHtml(WEBSITE_NAME)}"
                   style="display:block;width:44px;max-width:44px;height:auto;margin:0 auto 10px;" />
              <div style="font-family:${FONT_STACK};font-size:15px;font-weight:600;letter-spacing:.18em;
                          text-transform:uppercase;color:${BRAND.white};">Podocarpus</div>
              <div style="font-family:${FONT_STACK};font-size:11px;letter-spacing:.08em;color:${BRAND.faint};margin-top:4px;">
                Real Estate Investment &middot; Dubai
              </div>
            </td>
          </tr>

          <!-- content -->
          <tr>
            <td class="sm-px" style="padding:40px 40px 8px;">
              <h1 class="sm-h1 dm-heading" style="margin:0 0 18px;font-family:${FONT_STACK};font-size:24px;
                         line-height:1.3;font-weight:700;color:${BRAND.ink};">${escapeHtml(heading)}</h1>
              <div class="dm-text">
                ${greetingHtml}
                ${paragraphsHtml}
              </div>
              ${buttonHtml}
              ${linkFallbackHtml}
              ${infoBoxHtml}
            </td>
          </tr>

          <!-- divider -->
          <tr>
            <td class="sm-px" style="padding:32px 40px 0;">
              <div class="dm-hairline" style="border-top:1px solid ${BRAND.hairline};font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>

          <tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>
          ${footnoteHtml}

          <!-- footer -->
          <tr>
            <td class="sm-px" style="padding:8px 40px 32px;">
              <p class="dm-muted" style="margin:0 0 6px;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:${BRAND.muted};">
                &copy; ${year} ${escapeHtml(WEBSITE_NAME)}. All rights reserved.
              </p>
              <p class="dm-muted" style="margin:0;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:${BRAND.muted};">
                This is an automated message from
                <a href="${WEBSITE_URL}" style="color:${BRAND.primary};text-decoration:none;">pdcps.co</a>.
                Please do not share its links with anyone.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  // Plaintext part, derived from the same content.
  const textLines: string[] = [WEBSITE_NAME.toUpperCase(), '', heading, ''];
  if (greeting) textLines.push(toPlain(greeting), '');
  paragraphs.forEach((p) => textLines.push(toPlain(p), ''));
  if (button) textLines.push(`${button.label}: ${button.url}`, '');
  if (infoBox) {
    textLines.push(
      `${infoBox.label ? `${infoBox.label} ` : ''}${toPlain(infoBox.text)}`,
      '',
    );
  }
  if (footnote) textLines.push(toPlain(footnote), '');
  textLines.push('---', `© ${year} ${WEBSITE_NAME}`, WEBSITE_URL);

  return { html, text: textLines.join('\n').replace(/\n{3,}/g, '\n\n') };
}
