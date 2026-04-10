const {
  ensureEnglishAndOdiaTranslations,
  ensureOptionTranslations,
} = require("../src/modules/onlineExam/translation.service");

async function main() {
  const text = await ensureEnglishAndOdiaTranslations("Champion of IPL 2025", "en");
  const options = await ensureOptionTranslations(["Kolkata", "RCB"], "en");
  console.log(JSON.stringify({ text, options }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
