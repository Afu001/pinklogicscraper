const express = require("express");
const puppeteer = require("puppeteer-core"); // Use puppeteer-core
const bodyParser = require("body-parser");
const app = express();

// Add body-parser middleware to parse JSON request bodies
app.use(bodyParser.json());

// Define a route for scraping
app.post("/scrape", async (req, res) => {
  const { username, password } = req.body;
  try {
    const data = await loginAndScrape(username, password);
    res.json(data);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: "An error occurred" });
  }
});

// Your scraping function
const loginAndScrape = async (username, password) => {
  let browser;
  try {
    // Specify the executable path for Chromium on Vercel
    const executablePath = process.env.CHROME_BIN || "/usr/bin/google-chrome";

    browser = await puppeteer.launch({
      headless: true,
      executablePath, // Use the provided headless Chrome instance on Vercel
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.goto("https://fallzabdesk.szabist-isb.edu.pk/", {
      waitUntil: "domcontentloaded",
    });

    await page.type('input[name="txtLoginName"]', username);
    await page.type('input[name="txtPassword"]', password);

    await page.click('img[alt="ZABDESK Login"]');

    await page.goto(
      "https://fallzabdesk.szabist-isb.edu.pk/Student/QryCourseRecapSheet.asp",
      {
        waitUntil: "domcontentloaded",
      }
    );

    const data = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("td"));
      let name = "N/A";
      let reg = "N/A";
      let semester = "N/A";
      let cgpa = "N/A";

      for (let i = 0; i < elements.length; i++) {
        const text = elements[i].textContent.trim();

        if (text === "Student Name") {
          name = elements[i + 1].textContent.trim();
        } else if (text === "Registration Number") {
          reg = elements[i + 1].textContent.trim();
        } else if (text === "Semester") {
          semester = elements[i + 1].textContent.trim();
        } else if (text === "CGPA") {
          cgpa = elements[i + 1].textContent.trim();
        }
      }

      return { name, reg, semester, cgpa };
    });

    return data;
  } catch (error) {
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
