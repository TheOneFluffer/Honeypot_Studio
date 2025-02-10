const puppeteer = require('puppeteer');
const processLogs = require('./logProcessor');

// Custom wait function
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    console.log('Launching the browser...');
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log('Processing logs to get protocols and keywords...');
        const { uniqueProtocols, uniqueKeywords } = await processLogs(false); // Pass false to suppress logs

        // Combine protocols and keywords into a single search string
        const searchQuery = `${uniqueProtocols.join(' ')} ${uniqueKeywords.join(' ')}`;
        console.log(`Compiled search query: ${searchQuery}`);

        console.log('Navigating to CVE website...');
        await page.goto('https://www.cve.org', { waitUntil: 'networkidle2', timeout: 60000 }); // Extended timeout

        console.log('Waiting for the CVE ID input field to be visible...');
        await page.waitForSelector('input.cve-id-input', { timeout: 15000 });

        console.log(`Entering search query: ${searchQuery}`);
        await page.type('input.cve-id-input', searchQuery);

        console.log('Clicking cookie');
        await wait(5000); // 5 seconds delay
        await page.click('button.cve-button');

        console.log('Search button is now enabled. Waiting for 5 seconds for page to load before clicking the button...');
        await wait(5000); // 5 seconds delay
        await page.click('button.cve-button');

        console.log('Waiting for the search results...');
        await page.waitForSelector('.columns.cve-columns', { timeout: 15000 });

        console.log('Checking for the CVE link...');
        const cveLinkSelector = 'div.columns.cve-columns a[href*="/CVERecord?id="]';
        const linkElement = await page.$(cveLinkSelector);

        if (linkElement) {
            console.log('CVE link found, clicking on it...');
            const newPagePromise = new Promise((resolve) =>
                browser.once('targetcreated', (target) => resolve(target.page()))
            );

            await linkElement.click();
            console.log('Waiting for the new tab to open...');

            const newPage = await newPagePromise;

            if (newPage) {
                console.log('New tab opened. Waiting for it to load...');
                await newPage.waitForSelector('h1.title', { timeout: 15000 });

                console.log('Taking a screenshot of the new page...');
                await newPage.screenshot({ path: 'cve_new_tab.png', fullPage: true });
                console.log('Screenshot saved as cve_new_tab.png');

                console.log('Extracting CVE title...');
                const cveTitle = await newPage.$eval('h1.title', (h1) => h1.textContent.trim());
                console.log(`Extracted CVE title: ${cveTitle}`);

                console.log('Extracting description...');
                const description = await newPage.$eval(
                    'p.content.cve-x-scroll',
                    (p) => p.textContent.trim()
                );
                console.log(`Extracted Description: ${description}`);

                console.log('Extracting CVSS Score, Severity, Version, and Vector String...');
                try {
                    const cvssDetails = await newPage.$eval(
                        'tbody[data-v-de5af066] tr[data-v-de5af066]',
                        (row) => {
                            const cells = row.querySelectorAll('td');
                            return {
                                score: cells[0]?.textContent.trim() || 'N/A',
                                severity: cells[1]?.textContent.trim() || 'N/A',
                                version: cells[2]?.textContent.trim() || 'N/A',
                                vectorString: cells[3]?.textContent.trim() || 'N/A',
                            };
                        }
                    );
                    console.log('Extracted CVSS Details:');
                    console.log(`  Score: ${cvssDetails.score}`);
                    console.log(`  Severity: ${cvssDetails.severity}`);
                    console.log(`  Version: ${cvssDetails.version}`);
                    console.log(`  Vector String: ${cvssDetails.vectorString}`);
                } catch (error) {
                    console.error('Error extracting CVSS details:', error);
                }

                console.log('Extracting Vendor/Product/Platform Details...');
                try {
                    const platformDetails = await newPage.$$eval(
                        "div[id='cve-vendor-product-platforms']",
                        (entries) => {
                            return entries.map((entry, index) => {
                                const vendor = entry.querySelector("div.level-item:nth-child(1) p:nth-child(2)")?.textContent.trim() || 'N/A';
                                const product = entry.querySelector("div.level-item:nth-child(2) p:nth-child(2)")?.textContent.trim() || 'N/A';
                                const versionsText = entry.querySelector("p.cve-product-status-heading span.tag")?.textContent.trim() || '0 Total';
                                const defaultStatus = entry.querySelector("div#cve-version-default-status p.cve-help-text")?.textContent.trim() || 'N/A';
                                const affectedVersions = Array.from(
                                    entry.querySelectorAll("div#affected ul.menu-list li")
                                ).map((li) => li.textContent.trim()) || [];

                                return {
                                    entry: index + 1,
                                    vendor,
                                    product,
                                    versionsText,
                                    defaultStatus,
                                    affectedVersions,
                                };
                            });
                        }
                    );

                    if (platformDetails.length > 0) {
                        console.log('Extracted Vendor/Product/Platform Details:');
                        platformDetails.forEach((detail) => {
                            console.log(`Entry ${detail.entry}:`);
                            console.log(`  Vendor: ${detail.vendor}`);
                            console.log(`  Product: ${detail.product}`);
                            console.log(`  Total Versions: ${detail.versionsText}`);
                            console.log(`  Default Status: ${detail.defaultStatus}`);
                            console.log(`  Affected Versions: ${detail.affectedVersions.length > 0
                                ? detail.affectedVersions.join(', ')
                                : 'None'
                                }`);
                        });
                    } else {
                        console.log('No platform details found.');
                    }
                } catch (error) {
                    console.error('Error extracting Vendor/Product/Platform details:', error);
                }
            } else {
                console.log('Failed to detect the new tab.');
            }


        } else {
            console.log('CVE link not found in the search results.');
        }


    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        // console.log('Closing the browser...');
        // await browser.close();
        // console.log('Browser closed.');
        console.log('done');
    }
})();
