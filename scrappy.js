const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser"); // Import body-parser
const app = express();

// Add body-parser middleware to parse JSON request bodies
app.use(bodyParser.json());

// Define a route for scraping
app.post("/scrape", async (req, res) => { // Change route to accept POST requests
  const { username, password } = req.body; // Extract username and password from request body
  try {
    const data = await loginAndScrape(username, password); // Pass username and password to the scraping function
    res.json(data); // Send the scraped data as JSON response
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Your scraping function
const loginAndScrape = async (username, password) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    });

    const page = await browser.newPage();

    // Navigate to the login page
    await page.goto("https://fallzabdesk.szabist-isb.edu.pk/", {
      waitUntil: "domcontentloaded",
    });

    // Fill in the username and password inputs
    await page.type('input[name="txtLoginName"]', username);
    await page.type('input[name="txtPassword"]', password);

    // Click the login button
    await page.click('img[alt="ZABDESK Login"]');

    // Wait for the login to complete (you may need to adjust this)
    await page.waitForNavigation();

    // Navigate to the specific page
    await page.goto("https://fallzabdesk.szabist-isb.edu.pk/Student/QryCourseRecapSheet.asp", {
      waitUntil: "domcontentloaded",
    });

    // Extract data from the provided HTML code
    const data = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('td'));
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

// Start the Express app on a specific port (e.g., 3000)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
