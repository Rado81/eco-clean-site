// Build-environment flags. SITE_PREVIEW=1 marks a preview deployment (GitHub
// Pages): every page gets a noindex robots meta so the preview copy is never
// indexed instead of the real site at eco-clean.nu.
export default {
  preview: process.env.SITE_PREVIEW === "1",
};
