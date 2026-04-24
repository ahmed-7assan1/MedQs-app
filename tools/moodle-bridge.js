/**
 * MEDQS MOODLE BRIDGE v1.0
 * 
 * 1. Open terminal in this folder
 * 2. Run: node tools/moodle-bridge.js
 * 
 * This script will:
 * - Scrape CNS & ENR, Research, and ECE 3 from MNU LMS.
 * - Auto-upload files to your MedOneX storage.
 * - Sync the structure to your database.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. BOOTSTRAP: Install dependencies if missing
function bootstrap() {
    const deps = ['puppeteer', 'axios', 'uploadthing', 'form-data', 'dotenv'];
    let installNeeded = false;
    deps.forEach(dep => {
        try { require.resolve(dep); } catch (e) { installNeeded = true; }
    });

    if (installNeeded) {
        console.log("Installing necessary tools (Puppeteer, Axios, etc.)... Please wait.");
        execSync(`npm install ${deps.join(' ')}`, { stdio: 'inherit' });
        console.log("Installation complete!\n");
    }
}

bootstrap();

const puppeteer = require('puppeteer');
const axios = require('axios');
const { UTApi } = require('uploadthing/server');
require('dotenv').config();

// Configuration
const CONFIG = {
    LMS_URL: 'https://lms.mansnu.edu.eg/moodle2026/',
    TARGET_SEMESTER_ID: '5f8dece2-6980-4a76-95ad-69d5850eb39b',
    MEDONEX_API: 'http://localhost:3000/api/v1/admin/sync/moodle', 
    COURSES: ['Central Nervous', 'Research', 'Early Clinical Experience 3'],
    UPLOAD_TOKEN: process.env.UPLOADTHING_TOKEN,
    // Persistence: This folder will store your login session
    USER_DATA_DIR: path.join(__dirname, '../.moodle_profile')
};

const utapi = new UTApi({ token: CONFIG.UPLOAD_TOKEN });

async function run() {
    console.log("--- MedOneX Moodle Bridge Starting ---");
    
    // Create profile dir if doesn't exist
    if (!fs.existsSync(CONFIG.USER_DATA_DIR)) fs.mkdirSync(CONFIG.USER_DATA_DIR);

    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        userDataDir: CONFIG.USER_DATA_DIR, // This saves your login!
        args: ['--start-maximized']
    });
    const page = await browser.newPage();

    try {
        // 1. LOGIN PHASE
        console.log("Please log in to the LMS in the opened browser window...");
        await page.goto(CONFIG.LMS_URL + 'login/index.php');
        
        // Wait for user to be logged in and reach dashboard
        await page.waitForFunction(() => window.location.href.includes('/my/'), { timeout: 0 });
        console.log("Login successful! Starting extraction...");

        const results = [];

        for (const courseNamePattern of CONFIG.COURSES) {
            console.log(`\nSearching for course: ${courseNamePattern}...`);
            await page.goto(CONFIG.LMS_URL + 'my/courses.php');
            await page.waitForSelector('.course-list-item, .coursename', { timeout: 10000 });

            const courseLink = await page.evaluate((pattern) => {
                const links = Array.from(document.querySelectorAll('a'));
                const found = links.find(a => a.textContent.includes(pattern));
                return found ? found.href : null;
            }, courseNamePattern);

            if (!courseLink) {
                console.log(`Could not find course matching "${courseNamePattern}". Skipping.`);
                continue;
            }

            console.log(`Found! Entering: ${courseLink}`);
            await page.goto(courseLink);
            
            const moduleData = {
                name: courseNamePattern,
                subjects: []
            };

            // 2. EXTRACT SECTIONS (Subjects)
            const sections = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.section.main')).map(s => {
                    const title = s.querySelector('.sectionname')?.textContent?.trim() || "General";
                    const folders = Array.from(s.querySelectorAll('.activity.folder a')).map(a => ({
                        name: a.textContent.trim(),
                        href: a.href
                    }));
                    return { title, folders };
                });
            });

            for (const section of sections) {
                if (section.folders.length === 0) continue;

                const subject = { name: section.title, lectures: [] };
                console.log(`  - Processing Subject: ${section.title}`);

                for (const folder of section.folders) {
                    console.log(`    - Entering Folder: ${folder.name}`);
                    const folderPage = await browser.newPage();
                    await folderPage.goto(folder.href);

                    const files = await folderPage.evaluate(() => {
                        return Array.from(document.querySelectorAll('.fp-filename-icon a')).map(a => ({
                            name: a.textContent.trim(),
                            url: a.href
                        }));
                    });

                    if (files.length > 0) {
                        const lecture = { title: folder.name, files: [] };
                        
                        for (const fileData of files) {
                            console.log(`      - Downloading/Uploading: ${fileData.name}`);
                            try {
                                // Upload directly from URL (UploadThing supports this in some versions or we download locally)
                                // To be safe and bypass Moodle session, we download first via puppeteer/page
                                const viewSource = await folderPage.goto(fileData.url);
                                const buffer = await viewSource.buffer();
                                
                                // Upload to UploadThing
                                const uploadResult = await utapi.uploadFiles(
                                    new File([buffer], fileData.name, { type: 'application/pdf' })
                                );

                                if (uploadResult.data) {
                                    lecture.files.push({
                                        name: fileData.name,
                                        url: uploadResult.data.url,
                                        mimeType: 'application/pdf'
                                    });
                                }
                            } catch (e) {
                                console.error(`      ! Failed to process file ${fileData.name}:`, e.message);
                            }
                        }
                        subject.lectures.push(lecture);
                    }
                    await folderPage.close();
                }
                moduleData.subjects.push(subject);
            }
            results.push(moduleData);
        }

        // 3. SYNC TO MEDONEX
        console.log("\n--- Extraction Finished. Syncing to MedOneX Database ---");
        const syncResponse = await axios.post(CONFIG.MEDONEX_API, {
            semesterId: CONFIG.TARGET_SEMESTER_ID,
            modules: results
        }, {
            headers: {
                'x-admin-sync-key': process.env.ADMIN_SYNC_KEY || "medonex_secret_sync_2026"
            }
        });

        if (syncResponse.data.ok) {
            console.log("\nSUCCESS! Your modules are now synced.");
            console.log("Stats:", syncResponse.data.stats);
        } else {
            console.log("\nSync failed:", syncResponse.data.error);
        }

    } catch (err) {
        console.error("\nCRITICAL ERROR:", err);
    } finally {
        console.log("\nClosing browser...");
        await browser.close();
    }
}

run();
