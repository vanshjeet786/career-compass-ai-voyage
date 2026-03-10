import { chromium } from 'playwright';
import * as fs from 'fs';

async function runAssessments() {
    const numRuns = 5;
    const results = [];

    const browser = await chromium.launch({ headless: true });

    for (let i = 1; i <= numRuns; i++) {
        console.log(`Starting run ${i}/${numRuns}...`);
        const context = await browser.newContext();
        const page = await context.newPage();

        page.on('console', msg => {
            if (msg.type() === 'error') {
               console.log(`[Browser Error]: ${msg.text()}`);
            }
        });
        const runStartTime = Date.now();

        const testEmail = `test_user_${Date.now()}_${i}@example.com`;

        try {
            console.log(`  Run ${i} - Navigating to Auth`);
            await page.goto('http://127.0.0.1:8080/auth', { waitUntil: 'networkidle' });

            await page.click('text="Sign up"');

            console.log(`  Run ${i} - Registering user ${testEmail}`);
            await page.waitForSelector('button:has-text("Sign Up")', { timeout: 10000 });
            await page.fill('input[type="email"]', testEmail);
            await page.fill('input[type="password"]', 'Password123!');
            await page.click('button:has-text("Sign Up")');

            try {
               await page.waitForURL('**/background-info', { timeout: 15000 });
               await page.waitForTimeout(2000);
            } catch (e) {
               console.log(`  Run ${i} - Didn't redirect to background info automatically.`);
            }

            console.log(`  Run ${i} - Filling out background info`);

            try {
                // Ensure form opens reliably
                await page.locator('button:has-text("Add Background Info")').waitFor({ state: 'visible', timeout: 5000 });
                await page.click('button:has-text("Add Background Info")');
                await page.waitForTimeout(1000);

                try {
                   await page.waitForSelector('text="I am currently a..."', { timeout: 5000 });
                } catch(e) {
                   await page.click('button:has-text("Add Background Info")');
                   await page.waitForTimeout(1000);
                }

                await page.click('button[role="combobox"]');
                await page.click('div[role="option"]:has-text("Working Professional")');

                await page.click('button[role="combobox"]:has-text("Search or type")');
                await page.keyboard.type('Software Engineer');
                await page.waitForTimeout(500);
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('Enter');

                await page.fill('input[placeholder="e.g. 5"]', '3');

                const saveStartBtn = page.locator('button:has-text("Save & Start Assessment")');
                if (await saveStartBtn.isVisible()) {
                    await saveStartBtn.click();
                } else {
                    const saveBtn = page.locator('button:has-text("Save")');
                    if (await saveBtn.isVisible()) {
                        await saveBtn.click();
                        await page.waitForTimeout(1000);
                        const startBtn = page.locator('button:has-text("Start Assessment")');
                        if (await startBtn.isVisible()) await startBtn.click();
                    }
                }
            } catch (e) {
                console.log(`  Run ${i} - Couldn't fill background info, trying to proceed to assessment...`);
                if (await page.locator('button:has-text("New Assessment")').isVisible()) {
                    await page.click('button:has-text("New Assessment")');
                }
            }

            try {
               await page.waitForURL('**/assessment*', { timeout: 10000 });
               await page.waitForTimeout(2000);
            } catch (e) {
               console.log(`  Run ${i} - Assessment URL wait failed. Current URL: ${page.url()}`);
               if (page.url().includes('background-info')) {
                    const newAssBtn = page.locator('button:has-text("New Assessment")');
                    if (await newAssBtn.isVisible()) {
                       await newAssBtn.click();
                       await page.waitForTimeout(2000);
                    }
               }
            }

            for (let layer = 1; layer <= 6; layer++) {
                console.log(`  Run ${i} - Layer ${layer} started`);

                try {
                    await page.waitForSelector('.space-y-6 > div', { timeout: 15000 });
                } catch(e) {
                    await page.screenshot({ path: `layer-error-run-${i}-layer-${layer}.png` });
                    throw e;
                }

                const questions = await page.locator('.space-y-6 > div').all();
                console.log(`  Run ${i} - Found ${questions.length} questions in Layer ${layer}`);

                for (let q = 0; q < questions.length; q++) {
                    const question = questions[q];

                    const radioGroup = question.locator('div[role="radiogroup"]');
                    if (await radioGroup.isVisible()) {
                        const randomOption = Math.floor(Math.random() * 5);
                        const options = await radioGroup.locator('button').all();
                        if (options.length > randomOption) {
                            await options[randomOption].scrollIntoViewIfNeeded();
                            await options[randomOption].click();
                        }
                    } else {
                        const textInputs = await question.locator('input[type="text"]').all();
                        if (textInputs.length > 0) {
                            for (const input of textInputs) {
                                await input.scrollIntoViewIfNeeded();
                                await input.fill(`Career ${Math.random().toString(36).substring(7)}`);
                            }
                        } else {
                            const textareas = await question.locator('textarea').all();
                            if (textareas.length > 0) {
                                for (const ta of textareas) {
                                    await ta.scrollIntoViewIfNeeded();
                                    await ta.fill(`This is a random response ${Math.random().toString(36).substring(7)} for testing purposes.`);
                                }
                            } else {
                                const anyInputs = await question.locator('input').all();
                                for (const input of anyInputs) {
                                    try {
                                       await input.scrollIntoViewIfNeeded();
                                       await input.fill(`Career ${Math.random().toString(36).substring(7)}`);
                                    } catch (e) {}
                                }
                            }
                        }
                    }
                }
                await page.waitForTimeout(1000);

                const nextButtonLocator = layer === 6 ? 'button:has-text("Finish Assessment")' : 'button:has-text("Next")';
                const nextButton = page.locator(nextButtonLocator).last();

                try {
                   await nextButton.scrollIntoViewIfNeeded();
                   await page.waitForTimeout(500);
                   await nextButton.evaluate((node) => (node as HTMLElement).click());
                } catch(e) {
                   await nextButton.click({ force: true });
                }

                try {
                   if (layer < 6) {
                       await page.waitForSelector(`text=Layer ${layer + 1} of 6`, { timeout: 15000 });
                   } else {
                       await page.waitForURL('**/results*', { timeout: 30000 });
                   }
                } catch(e) {
                   console.log(`  Run ${i} - Layer ${layer} failed to advance. Checking for missing required fields...`);

                   const allQuestions = await page.locator('.space-y-6 > div').all();
                   for (const q of allQuestions) {
                       const hasError = await q.locator('span.text-destructive.text-xs:has-text("* Required")').isVisible();
                       if (hasError) {
                           console.log(`  Run ${i} - Found a missing question, re-answering...`);
                           const radioGroups = await q.locator('div[role="radiogroup"] > div').all();
                           if (radioGroups.length > 0) {
                               await radioGroups[0].scrollIntoViewIfNeeded();
                               await page.waitForTimeout(100);
                               await radioGroups[0].click({ force: true });
                                   try {
                                       await radioGroups[0].locator('button').click({ force: true });
                                   } catch(e) {}
                           } else {
                               const textareas = await q.locator('textarea').all();
                               for (const ta of textareas) {
                                   await ta.fill(`Fixed mock response`);
                               }
                               const inputs = await q.locator('input[type="text"]').all();
                               for (const inp of inputs) {
                                   await inp.fill(`Fixed career`);
                               }
                           }
                       }
                   }

                   await nextButton.evaluate((node) => (node as HTMLElement).click());

                   if (layer < 6) {
                       await page.waitForSelector(`text=Layer ${layer + 1} of 6`, { timeout: 15000 });
                   }
                }
            }

            try {
                await page.waitForURL('**/results*', { timeout: 30000 });
            } catch (e) {
                console.log(`  Run ${i} - Timeout waiting for URL, current URL: ${page.url()}`);

                if (page.url().includes('assess')) {
                   console.log(`  Run ${i} - Trying to click Finish Assessment again...`);
                   const nextButtonLocator = 'button:has-text("Finish Assessment")';
                   const nextButton = page.locator(nextButtonLocator).last();
                   if (await nextButton.isVisible()) {
                      await nextButton.scrollIntoViewIfNeeded();
                      await nextButton.evaluate((node) => (node as HTMLElement).click());
                      await page.waitForURL('**/results*', { timeout: 15000 });
                   } else {
                       throw e;
                   }
                } else {
                   throw e;
                }
            }
            console.log(`  Run ${i} - Reached Results Page`);

            await page.waitForSelector('text=Your Career Blueprint', { timeout: 60000 });
            await page.waitForTimeout(2000);

            const recommendationsLocators = await page.locator('h3.font-semibold.text-lg').all();
            const careers = [];
            for (const rec of recommendationsLocators) {
                const text = await rec.innerText();
                if (text) careers.push(text.trim());
            }

            const topTraitsLocators = await page.locator('.font-medium.truncate').all();
            const topTraits = [];
            for (const t of topTraitsLocators) {
               topTraits.push(await t.innerText());
            }

            const runTimeMs = Date.now() - runStartTime;
            const runTimeSec = (runTimeMs / 1000).toFixed(2);

            const result = {
              run: i,
              email: testEmail,
              durationSeconds: runTimeSec,
              careers: careers.length > 0 ? careers : ['No specific careers found in DOM'],
              topTraits: topTraits.length > 0 ? topTraits : ['No top traits found in DOM']
            };

            results.push(result);
            console.log(`  Run ${i} Complete: ${JSON.stringify(result)}`);

        } catch (e: any) {
            console.error(`  Run ${i} failed:`, e.message);
            results.push({ run: i, error: e.message });
        } finally {
            await context.close();
        }
    }

    await browser.close();
    fs.writeFileSync('run-results-5.json', JSON.stringify(results, null, 2));
    console.log('All runs complete! Results saved to run-results-5.json');
}

runAssessments().catch(console.error);
