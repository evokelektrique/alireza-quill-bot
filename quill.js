require("dotenv").config();
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const { executablePath } = require("puppeteer");
const { exit, env } = require("process");
const list_path = path.resolve("./list.txt");
const plugin_path = path.resolve("./plugin"); // Convert relative to absolute path
const plugin_config_path = path.resolve("./plugin/js/config_ac_api_key.js"); // Convert relative to absolute path
const global_args = [
  "--disable-web-security",
  "--disable-features=IsolateOrigins,site-per-process",
  "--allow-running-insecure-content",
  "--disable-blink-features=AutomationControlled",
  "--no-sandbox",
  "--mute-audio",
  "--no-zygote",
  "--no-xshm",
  "--window-size=1920,1080",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--enable-webgl",
  "--ignore-certificate-errors",
  "--lang=en-US,en;q=0.9",
  "--password-store=basic",
  "--disable-gpu-sandbox",
  "--disable-software-rasterizer",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding",
  "--disable-infobars",
  "--disable-breakpad",
  "--disable-canvas-aa",
  "--disable-2d-canvas-clip-aa",
  "--disable-gl-drawing-for-tests",
  "--enable-low-end-device-mode",
  "--disable-extensions-except=" + plugin_path,
  "--load-extension=" + plugin_path,
];
const Logger = require("@ptkdev/logger");

const logger_options = {
  language: "en",
  colors: true,
  debug: true,
  info: true,
  warning: true,
  error: true,
  sponsor: true,
  write: true,
  type: "log",
  rotate: {
    size: "10M",
    encoding: "utf8",
  },
  path: {
    // remember: add string *.log to .gitignore
    debug_log: path.resolve("./debug.log"),
    error_log: path.resolve("./errors.log"),
  },
};
const logger = new Logger(logger_options);

// Set api key
const apiKey = process.env.API_KEY;
if (fs.existsSync(plugin_config_path)) {
  let confData = fs.readFileSync(plugin_config_path, "utf8");
  confData = confData.replace(
    /antiCapthaPredefinedApiKey = ''/g,
    `antiCapthaPredefinedApiKey = '${apiKey}'`
  );
  fs.writeFileSync(plugin_config_path, confData, "utf8");
} else {
  logger.error("Plugin configuration not found!");
}

// Read the list
const list_data = fs.readFileSync(list_path, { encoding: "utf-8" });
list = generate_list(list_data);

// Main stuff
(async () => {
  // Init browser
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath(),
    ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
    args: global_args,
  });

  const page = await browser.newPage();

  // Disable navigation timeout errors
  await page.setDefaultNavigationTimeout(0);

  logger.info("Browser Initiated");

  for (let index = 0; index < list.length; index++) {
    const item = list[index].item.trim().split(":");
    const email = item[0];
    const password = item[1];
    logger.info(
      "INDEX: " +
        index +
        " | " +
        "EMAIL: " +
        email +
        " | " +
        "PASSWORD: " +
        password
    );

    await page.goto("https://quillbot.com/login?returnUrl=/", {
      waitUntil: "networkidle2",
    });

    // Remove cookies popup
    await page
      .waitForSelector("#onetrust-banner-sdk", { visible: true })
      .catch((e) => {
        logger.error(e);
      });

    // Remove cookies popup
    await page
      .$eval("#onetrust-banner-sdk", (el) => el.remove())
      .catch((e) => {
        logger.error(e);
      });

    // Remove cookies popup
    await page
      .$eval(".onetrust-pc-dark-filter", (el) => el.remove())
      .catch((e) => {
        logger.error(e);
      });

    // Detect Login button
    await page
      .waitForFunction(
        'document.querySelector("button.auth-btn").innerText == "Log In"'
      )
      .catch((e) => {
        logger.error(e);
      });

    logger.info("Found submit button");

    // Fill email
    await page.$eval("#mui-3", (el, email) => (el.value = email), email);

    // Fill password
    await page.$eval(
      "#mui-4",
      (el, password) => {
        return (el.value = password);
      },
      password
    );

    // Click on login
    await page.click("button.auth-btn");
    logger.info("Clicked on Login button");

    // Remove it
    await page.waitForTimeout(300000);
  }
})();

/**
 *
 * @param {String} data Given list data
 *
 * @returns Array of list
 */
function generate_list(data) {
  if (data === "" || data === undefined) {
    console.log("empty list given");
  }

  const list = [];

  data = data.split("\n");
  data.forEach((item) => {
    list.push({ item });
  });

  return list;
}