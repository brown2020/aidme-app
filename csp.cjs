/**
 * Content-Security-Policy for the static app.
 * Next.js hydration needs inline scripts. React refresh in `next dev` needs eval.
 * Production does not. Emulator hosts are added only when the build points at them.
 *
 * @param {{ emulatorHost?: string | null, allowEval?: boolean }} options
 * @returns {string}
 */
function contentSecurityPolicy(options = {}) {
  const emulatorHost = options.emulatorHost || null;
  const script = [
    "'self'",
    "'unsafe-inline'",
    "https://www.google.com",
    "https://www.gstatic.com",
    "https://apis.google.com",
    "https://www.googletagmanager.com",
    "https://www.recaptcha.net",
  ];
  if (options.allowEval) script.push("'unsafe-eval'");

  const connect = [
    "'self'",
    "https://*.googleapis.com",
    "https://*.firebaseio.com",
    "https://*.firebaseapp.com",
    "https://www.google.com",
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://firebaseinstallations.googleapis.com",
    "https://content-firebaseappcheck.googleapis.com",
    "https://recaptchaenterprise.googleapis.com",
    "wss://*.firebaseio.com",
  ];
  const forms = ["'self'"];
  const frame = [
    "https://accounts.google.com",
    "https://*.firebaseapp.com",
    "https://*.google.com",
    "https://www.recaptcha.net",
    "https://recaptcha.google.com",
  ];
  if (emulatorHost) {
    connect.push(
      `http://${emulatorHost}:9099`,
      `http://${emulatorHost}:8086`,
      `ws://${emulatorHost}:8086`
    );
    // Auth emulator popup, its form post, and the hidden auth iframe.
    frame.push(`http://${emulatorHost}:9099`);
    forms.push(`http://${emulatorHost}:9099`);
  }

  return [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com https://lh4.googleusercontent.com https://lh5.googleusercontent.com https://lh6.googleusercontent.com https://www.google.com https://www.gstatic.com https://www.googletagmanager.com",
    `connect-src ${connect.join(" ")}`,
    `frame-src ${frame.join(" ")}`,
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    `form-action ${forms.join(" ")}`,
    "frame-ancestors 'none'",
  ].join("; ");
}

module.exports = { contentSecurityPolicy };
