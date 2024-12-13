const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const nodemailer = require('nodemailer');
// const bcrypt = require('bcrypt');
const session = require('express-session');
const jwt = require('jsonwebtoken')
const app = express();
const port = 5000;
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const cron = require('node-cron');
const { Pool } = require('pg');
const e = require('express');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const xlsx = require('xlsx')
require('dotenv').config()
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(session({
    secret: 'aghan123',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use('/uploads', express.static('uploads'));

const MAX_DIRECT_REFERRALS = 6;
const MAX_LEVELS = 6;
const DIRECT_REFERRAL_INCOME = 500;
const REBIRTH_WALLET_INCOME = 150;
const TOTAL_REFERRALS_FOR_REBIRTH = 42;
const REGISTRATION_FEE = 5000;
const DIRECT_REFERRAL_COMMISSION_PERCENTAGE = 0.1;
const REBIRTH_LIMIT = 38
const SILVER_BOARD_INCOME_THRESHOLD = 5000
const GOLD_BOARD_INCOME_THRESHOLD = 10000;
const DIAMOND_BOARD_INCOME_THRESHOLD = 20000;
const PLATINUM_BOARD_INCOME_THRESHOLD = 50000;
const KING_BOARD_INCOME_THRESHOLD = 100000;
const BOARD_LEVEL_INCOME_PERCENTAGE = 0.1;
const SILVER_BOARD_UPGRADE_THRESHOLD = 5900;

const SILVER_BOARD_LEVEL_INCOME = SILVER_BOARD_INCOME_THRESHOLD * BOARD_LEVEL_INCOME_PERCENTAGE;
const GOLD_BOARD_LEVEL_INCOME = GOLD_BOARD_INCOME_THRESHOLD * BOARD_LEVEL_INCOME_PERCENTAGE;
const DIAMOND_BOARD_LEVEL_INCOME = DIAMOND_BOARD_INCOME_THRESHOLD * BOARD_LEVEL_INCOME_PERCENTAGE;
const PLATINUM_BOARD_LEVEL_INCOME = PLATINUM_BOARD_INCOME_THRESHOLD * BOARD_LEVEL_INCOME_PERCENTAGE;
const KING_BOARD_LEVEL_INCOME = KING_BOARD_INCOME_THRESHOLD * BOARD_LEVEL_INCOME_PERCENTAGE;
const SILVER_TO_GOLD_UPGRADE_AMOUNT = 10000;

cron.schedule('0 0 * * *', processRebirthBonuses);

const pgPool = new Pool({
    user: 'surya',
    host: 'localhost',
    database: 'Aghan',
    password: 'surya123',
    port: 5432,
});

// const pgPool = new Pool({
//     user: 'surya',
//     host: 'database-1.cbcm2uwoiait.ap-south-1.rds.amazonaws.com',
//     database: 'Aghan',
//     password: 'suryaprakash123',
//     port: 5432,
//     ssl: {
//         rejectUnauthorized: false,
//     },
// });


app.get('/', (req, res) => {
    res.send('CORS with two origins is configured!');
});


async function query(text, params) {
    const start = Date.now()
    const res = await pgPool.query(text, params)
    const duration = Date.now() - start
    console.log('executed query', { text, duration, rows: res.rowCount })
    return res;
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dirssp2002@gmail.com',
        pass: 'jwoa qfke xzyk lrls'
    }
});

const JWT_SECRET = 'aghan123';

let genealogyTree = {
    id: "AP5678", // Root user ID
    users: []
};

function generateOTP(email) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = (hash << 5) - hash + email.charCodeAt(i);
        hash |= 0;
    }
    return (Math.abs(hash) % 1000000).toString().padStart(6, '0');
}

async function generateRandomId() {
    let unique = false;
    let randomId;
    const client = await pgPool.connect(); // Ensure a connection to the database
    try {
        while (!unique) {
            // Generate a random number between 10000 and 99999
            const randomNumber = Math.floor(Math.random() * 90000) + 10000;
            randomId = `AP${randomNumber}`;

            // Check if the generated ID already exists in the 'users' table
            const result = await client.query(
                'SELECT COUNT(*) AS count FROM users WHERE user_id = $1',
                [randomId]
            );

            // If no record exists, the ID is unique
            if (parseInt(result.rows[0].count, 10) === 0) {
                unique = true;
            }
        }
    } catch (error) {
        console.error('Error generating unique ID:', error);
        throw new Error('Failed to generate unique ID.');
    } finally {
        client.release(); // Ensure the client connection is released
    }

    return randomId; // Return the unique ID
}


app.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const otp = generateOTP(email);

        const mailOptions = {
            from: 'dirssp2002@gmail.com',
            to: email,
            subject: 'Your OTP for Verification (Aghan Promoters)',
            html: `<table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td align="center" bgcolor="#ffffff">
                        <table width="600" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td align="center" bgcolor="#000000">
                                    <div style="width: 100%; max-width: 600px; height: 100px; background-color: #091023; display: table;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="start" style="width: 100%; height: 100%">
                                                    <img src="https://i.ibb.co/bvY6L8Y/aghan-logo-english.png" width="30%" style="display: block; margin: 0 auto" alt="Logo" />
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td align="center" bgcolor="#ffffff">
                        <div style="width: 100%; max-width: 600px; height: 500px; background-color: white; display: table;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 90px">
                                <tr>
                                    <td align="center" style="width: 60%; height: 100%">
                                        <p style="color: black; text-align: center; font-size: 160%"><b>Welcome to</b></p>
                                        <p style="color: black; text-align: center; font-size: 160%"><b>AGHAN PROMOTERS</b></p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="width: 60%; height: 100%">
                                        <p style="color: black; text-align: center; font-size: 120%">Verification code for Registration</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="width: 60%; height: 100%">
                                        <div style="color: black; text-align: center; font-size: 120%">
                                            Your Verification Code :
                                            <span style="background-color: #f15529; color: white; padding: 5px; border-radius: 5px;"><b>${otp}</b></span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="width: 60%; height: 100%">
                                        <p style="color: black; text-align: center; font-size: 120%">Please don't share with anyone</p>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td align="center" bgcolor="#ffffff">
                        <div style="width: 100%; max-width: 600px; height: 100px; background-color: #39afa8; display: table; padding-bottom: 20px;">
                            <div>
                                <p style="color: white; font-size: 150%"><b>JOIN OUR TEAM</b></p>
                            </div>
                            <div>
                                <p style="color: white; font-size: 100%">Check our Aghan Promoters Blog for new publications</p>
                            </div>
                            <div>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr align="center">
                                        <td>
                                            <a href="https://www.facebook.com/profile.php?id=61557114009922"><img src="https://i.ibb.co/4Z0LDK9/1.png" width="8%" style="display: block; margin: 0 auto" alt="Logo" /></a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            <div>
                                <p style="color: white; font-size: 100%">Click here to share your Aghan Promoters story, photos, and videos with the world!</p>
                            </div>
                            <div>
                                <p style="color: white; font-size: 160%"><b>AGHAN PROMOTERS LLP</b></p>
                            </div>
                            <div>
                                <p style="color: white; font-size: 105%">NO.1/198, Middle Street, Kiliyur & Post, Ulundurpet Taluk,</p>
                            </div>
                            <div>
                                <p style="color: white; font-size: 105%">Kallakurichi District, Tamilnadu, India - 606102</p>
                            </div>
                            <div style="padding-top: 20px">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr style="font-size: 100%" align="center">
                                        <td style="width: 33.33%">
                                            <a style="text-decoration: none; color: black" href="https://aghan.in/">
                                                <img src="https://i.ibb.co/cYMpqRK/8.png" width="30" height="30" alt="Logo" />
                                            </a>
                                        </td>
                                        <td style="width: 33.33%">
                                            <a style="text-decoration: none; color: black" href="tel:+917598818884">
                                                <img src="https://i.ibb.co/0KPCM7c/9.png" width="30" height="30" alt="Logo" />
                                            </a>
                                        </td>
                                        <td style="width: 33.33%">
                                            <a style="text-decoration: none; color: black" href="https://aghan.in/">
                                                <img src="https://i.ibb.co/Sw9FdSc/10.png" width="30" height="30" alt="Logo" />
                                            </a>
                                        </td>
                                    </tr>
                                    <tr style="font-size: 90%" align="center">
                                        <td style="width: 33.33%">
                                            <a style="text-decoration: none; color: black;" href="https://aghan.in/"><b>https://aghan.in/</b></a>
                                        </td>
                                        <td style="width: 33.33%">
                                            <a style="text-decoration: none; color: black;" href="mailto:support@aghan.in"><b>support@aghan.in</b></a>
                                        </td>
                                        <td style="width: 33.33%">
                                            <br />
                                            <a style="text-decoration: none; color: black;" href="tel:+917598818884"><b>+91 75988 18884</b></a>
                                            <br />
                                            <a style="text-decoration: none; color: black;" href="tel:+917598818885"><b>+91 75988 18885</b></a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully!' });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Failed to send OTP. Please try again later.' });
    }
});

async function findAndPlaceUser(userId, introducerId) {
    const client = await pgPool.connect();
    try {
        await client.query('BEGIN');
        const ancestorLevels = await getAncestorLevels(introducerId);

        await client.query(
            `INSERT INTO genealogy (user_id, level1, level2, level3, level4)
            VALUES ($1, $2, $3, $4, $5)`,
            [
                userId,
                ancestorLevels[0] || null,
                ancestorLevels[1] || null,
                ancestorLevels[2] || null,
                ancestorLevels[3] || null
            ]
        );

        //Improved logic to handle multiple available slots
        const availableSlots = await client.query(`
            SELECT user_id, member1, member2, member3, member4
            FROM genealogy
            WHERE member1 IS NULL OR member2 IS NULL OR member3 IS NULL OR member4 IS NULL;
        `);


        if (availableSlots.rows.length > 0) {
            const parentUser = availableSlots.rows[0];
            for (let i = 1; i <= MAX_DIRECT_REFERRALS; i++) {
                const memberSlot = `member${i}`;
                if (parentUser[memberSlot] === null) {
                    await client.query(
                        `UPDATE genealogy SET ${memberSlot} = $1 WHERE user_id = $2`,
                        [userId, parentUser.user_id]
                    );
                    console.log(`User ${userId} placed under ${parentUser.user_id} in slot ${memberSlot}`);
                    break;
                }
            }
        } else {
            console.log("No available slots found.");
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error placing user:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Helper function to get ancestor levels up to 6 levels
async function getAncestorLevels(introducerId) {
    const client = await pgPool.connect();
    const ancestorLevels = [introducerId];
    let currentId = introducerId;

    try {
        for (let i = 1; i < 4; i++) {
            if (!currentId) break;

            // Fetch the current ancestor's introducer from `users` table
            const result = await client.query(
                `SELECT introducer_id FROM users WHERE user_id = $1`,
                [currentId]
            );

            if (result.rows.length > 0 && result.rows[0].introducer_id) {
                ancestorLevels.push(result.rows[0].introducer_id);
                currentId = result.rows[0].introducer_id;
            } else {
                break;
            }
        }
    } catch (error) {
        console.error('Error retrieving ancestor levels:', error);
    } finally {
        client.release();
    }

    return ancestorLevels.slice(0, 6);
}

async function getAncestorLevelsFromGenealogy(userId) {
    let currentUserId = userId;
    const ancestors = [];
    const client = await pgPool.connect();

    try {
        for (let level = 1; level <= 4; level++) {
            const result = await client.query(
                `SELECT user_id 
                 FROM genealogy 
                 WHERE member1 = $1 
                    OR member2 = $1 
                    OR member3 = $1 
                    OR member4 = $1 
                 LIMIT 1`,
                [currentUserId]
            );

            if (result.rows.length === 0) {
                break; // No ancestor found for this level
            }

            // Get the ancestor ID and update the current user ID for the next level
            const ancestorId = result.rows[0].user_id;
            ancestors.push(ancestorId);
            currentUserId = ancestorId;
        }

        // Fill remaining levels with null if there are fewer than 6 ancestors
        while (ancestors.length < 4) {
            ancestors.push(null);
        }
    } catch (error) {
        console.error('Error fetching ancestor levels:', error);
    } finally {
        client.release();
    }

    return ancestors;
}

async function updateAncestorLevelsInGenealogy(userId) {
    const client = await pgPool.connect();
    const maxRetries = 3;
    let attempt = 0;

    try {
        const ancestors = await getAncestorLevelsFromGenealogy(userId);
        console.log(ancestors);

        while (attempt < maxRetries) {
            try {
                await client.query('BEGIN');

                await client.query(
                    `UPDATE genealogy
                     SET treelevel1 = $1, 
                         treelevel2 = $2, 
                         treelevel3 = $3, 
                         treelevel4 = $4, 
                     WHERE user_id = $5`,
                    [
                        ancestors[0] || null,
                        ancestors[1] || null,
                        ancestors[2] || null,
                        ancestors[3] || null,
                        userId
                    ]
                );

                await client.query('COMMIT');
                console.log(`Ancestor levels for user ${userId} updated successfully.`);
                break; // Exit retry loop if successful

            } catch (error) {
                // Handle lock timeout by retrying the transaction
                if (error.code === '40001') { // PostgreSQL error code for serialization failure
                    console.warn(`Serialization failure, retrying... Attempt ${attempt + 1} of ${maxRetries}`);
                    await client.query('ROLLBACK');
                    attempt++;
                } else {
                    // For other errors, throw
                    throw error;
                }
            }
        }

        if (attempt === maxRetries) {
            console.error(`Failed to update ancestor levels after ${maxRetries} attempts`);
        }

    } catch (error) {
        console.error('Error updating ancestor levels:', error);
    } finally {
        client.release();
    }
}

async function buildNestedTree(referrals, parentId, visited = new Set(), level = 0) {
    if (visited.has(parentId)) {
        return null; // Prevent infinite loops for circular references
    }
    visited.add(parentId);

    const parent = referrals.find(member => member.user_id === parentId);

    if (!parent) {
        return null;  // Handle missing parent gracefully
    }


    const children = [];
    for (let i = 1; i <= MAX_DIRECT_REFERRALS; i++) {
        const memberId = parent[`member${i}`];

        if (memberId) {
            const child = await buildNestedTree(referrals, memberId, visited, level + 1);

            if (child) {
                children.push(child);
            }

        }
    }


    return {
        ReferrerID: parent.user_id,
        user_id: parent.user_id,
        level: level,
        username: parent.username,
        // ... other parent properties you want to include
        children: children,
    };
}

async function getGenealogyTree(userId) {
    const client = await pgPool.connect();
    try {
        // 1. Fetch genealogy data first (more efficient)
        const { rows: genealogyData } = await client.query('SELECT * FROM genealogy');

        // 2. Recursive tree-building function (modified for efficiency)
        async function buildNestedTree(parentId, level = 0, visited = new Set()) {
            if (visited.has(parentId)) {
                return null;
            }
            visited.add(parentId);

            const parent = genealogyData.find(member => member.user_id === parentId);
            if (!parent) {
                return null;
            }

            // Fetch user data for this node
            const { rows: userData } = await client.query(
                'SELECT user_id, introducer_id, username, status, created_at FROM users WHERE user_id = $1',
                [parentId]
            );

            if (!userData || userData.length === 0) {
                return null; // Handle case where user data is missing
            }


            const children = [];
            for (let i = 1; i <= 4; i++) {
                const memberId = parent[`member${i}`];
                if (memberId) {
                    const childNode = await buildNestedTree(memberId, level + 1, visited);
                    if (childNode) {
                        children.push(childNode);
                    }
                }
            }

            return {
                referrer_id: userData[0].introducer_id || "Unknown",
                user_id: parentId,
                level,
                username: userData[0].username || "Unknown",
                status: userData[0].status || "Unknown",
                joined: userData[0].created_at || "Unknown",
                children
            };
        }

        // Start building the tree from the provided userId
        const tree = await buildNestedTree(userId);
        return tree;

    } catch (error) {
        console.error('Error building genealogy tree:', error);
        return null;
    } finally {
        client.release();
    }
}
async function creditDirectReferralIncome(referrerId, amount, userId) {
    const client = await pgPool.connect();
    try {
        // Fetch ancestor levels from the genealogy table
        const { rows: ancestors } = await client.query(`
            SELECT treelevel1, treelevel2, treelevel3, treelevel4
            FROM genealogy 
            WHERE user_id = $1
        `, [userId]);

        if (ancestors.length === 0) {
            console.log("No ancestors found for user:", userId);
            return; // Or handle the case where the user has no ancestors appropriately
        }

        // Filter out null values to get only eligible ancestor IDs
        const ancestorIds = Object.values(ancestors[0]).filter(id => id !== null);

        if (ancestorIds.length === 0) {
            console.log("No eligible ancestors for rebirth income for user:", userId);
            return;
        }

        // Credit the direct referral income to the referrer
        await client.query(
            `UPDATE users SET direct_referral_income = direct_referral_income + $1 WHERE user_id = $2`,
            [amount, referrerId]
        );
        console.log(`Direct referral income of ₹${amount} credited to user ${referrerId}`);

        // Record the wallet transaction
        await recordWalletTransaction(userId, amount, 'DIRECT_REFERRAL', referrerId, null);
        console.log(`Transaction recorded for user ${referrerId}: ₹${amount} - DIRECT_REFERRAL`);

    } catch (error) {
        console.error('Error crediting direct referral income:', error);
        throw error;
    } finally {
        client.release(); // Release the connection back to the pool
    }
}

async function handleRebirthIncome(userId) {
    const client = await pgPool.connect();

    try {
        const { rows: ancestors } = await client.query(`
            SELECT treelevel1, treelevel2, treelevel3, treelevel4
            FROM genealogy
            WHERE user_id = $1
        `, [userId]);

        if (!ancestors || ancestors.length === 0) {
            console.log("No ancestors found for user:", userId);
            return;
        }
        const ancestorIds = Object.values(ancestors[0]).filter(id => id !== null);
        if (ancestorIds.length === 0) {
            console.log("No eligible ancestors for rebirth income for user:", userId);
            return;
        }
        const { rows: packages } = await client.query(`
            SELECT package_price, level1, level2, level3, level4
            FROM packages
            LIMIT 1
        `);

        if (!packages || packages.length === 0) {
            console.log("No package details found for rebirth income calculation.");
            return;
        }
        const { package_price, level1, level2, level3, level4 } = packages[0];
        const levelPercentages = {
            1: level1,
            2: level2,
            3: level3,
            4: level4
        };
        const updates = [];
        for (let level = 1; level <= 4; level++) {
            const ancestorId = ancestors[0][`treelevel${level}`];
            if (ancestorId) {
                const incomePercent = levelPercentages[level];
                const rebirthIncome = (package_price * incomePercent) / 100;

                if (rebirthIncome > 0) {
                    updates.push(client.query(`
                        UPDATE users
                        SET rebirth_balance = rebirth_balance + $1
                        WHERE user_id = $2
                    `, [rebirthIncome, ancestorId]));
                    updates.push(recordWalletTransaction(userId, rebirthIncome, 'REBIRTH_INCOME', ancestorId));
                    console.log(`Rebirth income of ₹${rebirthIncome} credited to ancestor ${ancestorId} from user ${userId}`);
                }
            }
        }

        await Promise.all(updates);

    } catch (error) {
        console.error("Error handling rebirth income:", error);
        throw error;
    } finally {
        client.release();
    }
}

async function handleRebirth(userId) {
    const client = await pgPool.connect();
    try {
        const { rows: users } = await client.query(
            'SELECT rebirth_balance, rebirth_stage, rebirth_count FROM users WHERE user_id = $1',
            [userId]
        );

        if (!users || users.length === 0) {
            throw new Error(`User not found during handleRebirth: ${userId}`);
        }

        const { rebirth_balance, rebirth_stage, rebirth_count } = users[0];
        const rebirthThreshold = SILVER_BOARD_UPGRADE_THRESHOLD;

        if (rebirth_balance >= rebirthThreshold) {
            if (rebirth_stage === null || rebirth_stage === 0) {
                await client.query(
                    'UPDATE users SET rebirth_stage = 1 WHERE user_id = $1',
                    [userId]
                );
                console.log(`First threshold reached for user: ${userId}, stage set to 1.`);
            } else if (rebirth_stage === 1) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 15);
                const expiryDateString = expiryDate.toISOString();

                const rebirthInsert = await client.query(
                    'INSERT INTO rebirths (rebirth_id, user_id, expiry_date) VALUES ($1, $2, $3) RETURNING rebirth_id',
                    [uuidv4(), userId, expiryDateString]
                );

                if (rebirthInsert.rows.length > 0) {
                    await client.query('UPDATE users SET rebirth_stage = 2, rebirth_balance = 0.00 WHERE user_id = $1', [userId]);
                    scheduleBonus(userId, rebirthInsert.rows[0].rebirth_id, expiryDate); // Pass rebirth_id
                } else {
                    console.error("Failed to create rebirth record.");
                }
            } else if (rebirth_stage === 2) {
                if (rebirth_count < REBIRTH_LIMIT) {
                    await client.query(
                        'UPDATE users SET rebirth_balance = 0.00, rebirth_count = rebirth_count + 1 WHERE user_id = $1',
                        [userId]
                    );
                    console.log(`Rebirth #${rebirth_count + 1} handled for user: ${userId}.`);
                } else {
                    console.log(`User: ${userId} has reached the maximum rebirth count of ${REBIRTH_LIMIT}.`);
                }
            }
        } else {
            console.log(`Rebirth conditions not met for user: ${userId} (Balance: ${rebirth_balance}).`);
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error handling rebirth: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
}
function generateRandomPassword(length = 8) { // Function to generate random password
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

app.post('/transfer-funds', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const fromUserId = req.user.userId;
        const { toUserId, amount } = req.body;

        if (!toUserId || !amount || amount < 500 || isNaN(amount)) {
            return res.status(400).json({ message: 'Invalid transfer details. Amount must be a number greater than or equal to 500.' });
        }

        try {
            await client.query('BEGIN');

            const { rows } = await client.query(
                'SELECT 1 AS recipient_exists, (SELECT fund_income FROM users WHERE user_id = $1) AS sender_balance FROM users WHERE user_id = $2',
                [fromUserId, toUserId]
            );

            if (!rows[0]?.recipient_exists) {
                throw new Error('Recipient user not found.');
            }

            const senderBalance = parseFloat(rows[0].sender_balance);
            if (isNaN(senderBalance) || senderBalance < amount) {
                throw new Error('Insufficient balance.');
            }

            await client.query(
                'UPDATE users SET fund_income = fund_income - $1 WHERE user_id = $2',
                [amount, fromUserId]
            );
            await client.query(
                'UPDATE users SET fund_income = fund_income + $1 WHERE user_id = $2',
                [amount, toUserId]
            );

            await recordWalletTransaction(fromUserId, amount, "FUND_TRANSFER", toUserId);
            await client.query('COMMIT');
            res.json({ message: `Transferred Rs. ${amount} to ${toUserId} successfully.` });

        } catch (transferError) {
            await client.query('ROLLBACK');
            console.error('Transfer error:', transferError);
            if (transferError.message.includes('Recipient')) {
                res.status(404).json({ message: 'Recipient user not found.' });
            } else if (transferError.message.includes('Insufficient')) {
                res.status(400).json({ message: 'Insufficient balance.' });
            } else {
                res.status(500).json({ message: 'Fund transfer failed.' });
            }
        }

    } catch (error) {
        console.error('Error acquiring client or other error:', error);
        res.status(500).json({ message: 'Fund transfer failed.' });
    } finally {
        if (client) client.release();
    }
});

async function recordWalletTransaction(fromId, amount, transactionType, toid) {
    const client = await pgPool.connect();
    try {
        // Insert transaction record with UUID generation in PostgreSQL
        await client.query(
            `INSERT INTO wallettransactions (transactionid, fromid, amount, transactiontype, toid) 
             VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
            [fromId, amount, transactionType, toid]
        );
        console.log(`Transaction recorded: ${amount} - ${transactionType} - From: ${fromId} - To: ${toid}`);
    } catch (error) {
        console.error('Error recording wallet transaction:', error);
        throw error; // Re-throw to be handled at a higher level if needed
    } finally {
        client.release(); // Ensure the client is released back to the pool
    }
}

async function handleSilverBoardUpgrade(userId) {
    const client = await pgPool.connect();
    try {
        await client.query('BEGIN');
        const { rows: genealogyResult } = await client.query(
            `SELECT treelevel1, treelevel2, treelevel3, treelevel4
             FROM genealogy 
             WHERE user_id = $1`,
            [userId]
        );

        if (genealogyResult.length === 0) {
            console.log(`Genealogy data not found for user: ${userId}`);
            await client.query('ROLLBACK');
            return;
        }

        const treeLevels = Object.values(genealogyResult[0]).filter(Boolean);

        const ancestorUpgradePromises = treeLevels.map(async (ancestorId) => {
            if (await isUserOnSilverOrHigherBoard(ancestorId)) {
                console.log(`User ${ancestorId} is already on Silver Board or higher. Skipping upgrade.`);
                return;
            }

            const { rows: userResult } = await client.query('SELECT rebirth_balance FROM users WHERE user_id = $1', [ancestorId]);
            const rebirthBalance = userResult[0].rebirth_balance;

            if (rebirthBalance >= SILVER_BOARD_UPGRADE_THRESHOLD) {
                await client.query(
                    'INSERT INTO boards (userid, boardtype, status) VALUES ($1, $2, $3)',
                    [ancestorId, 'SILVER', 'ACTIVE']
                );

                await client.query(
                    'UPDATE users SET rebirth_balance = rebirth_balance - $1 WHERE user_id = $2',
                    [SILVER_BOARD_UPGRADE_THRESHOLD, ancestorId]
                );

                await client.query(
                    'UPDATE users SET silver_upgrade = silver_upgrade + $1 WHERE user_id = $2',
                    [SILVER_BOARD_UPGRADE_THRESHOLD, ancestorId]
                );

                await recordWalletTransaction(userId, SILVER_BOARD_LEVEL_INCOME, 'SILVER_BOARD_JOIN', ancestorId);
                console.log(`User ${ancestorId} upgraded to Silver Board.`);
                await sendBoardUpgradeEmail(ancestorId, 'SILVER');
            } else {
                console.log(`User ${ancestorId} does not meet the rebirth balance threshold for Silver Board upgrade.`);
            }
        });

        await Promise.all(ancestorUpgradePromises);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error handling Silver Board upgrades:', error);
        throw error;
    } finally {
        client.release();
    }
}
async function sendBoardUpgradeEmail(userId, boardType) {
    const client = await pgPool.connect();
    try {
        // Fetch user email from the users table
        const { rows: userResult } = await client.query(
            'SELECT email FROM users WHERE user_id = $1', [userId]
        );

        // Check if the user exists and has a valid email
        if (!userResult || userResult.length === 0 || !userResult[0].email) {
            console.log(`No valid email found for user ID: ${userId}. Skipping email.`);
            return;
        }

        const userEmail = userResult[0].email;

        const mailOptions = {
            from: 'dirssp2002@gmail.com', // Replace with your email
            to: userEmail,
            subject: `Congratulations! You've Upgraded to ${boardType} Board!`,
            html: `
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td align="center" bgcolor="#ffffff">
            <table width="600" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td align="center" bgcolor="#000000">
                        <div style="width: 100%; max-width: 600px; height: 100px; background-color: #091023; display: table;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="start" style="width: 100%; height: 100%">
                                        <img src="https://i.ibb.co/bvY6L8Y/aghan-logo-english.png" width="30%" style="display: block; margin: 0 auto" alt="Logo" />
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td align="center" bgcolor="#ffffff">
            <div style="width: 100%; max-width: 600px; height: auto; background-color: white; display: table;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 90px">
                    <tr>
                        <td align="center" style="width: 60%; height: 100%">
                            <p style="color: black; text-align: center; font-size: 160%"><b>Congratulations!</b></p>
                            <p style="color: black; text-align: center; font-size: 160%"><b>Your account has been upgraded!</b></p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="width: 60%; height: 100%">
                            <div style="color: black; text-align: center; font-size: 120%">
                                You are now part of the <span style="color: #f15529; font-weight: bold;">${boardType} Board</span>.
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="width: 60%; height: 100%">
                            <p style="color: black; text-align: center; font-size: 120%">Thank you for being with us!</p>
                        </td>
                    </tr>
                </table>
            </div>
        </td>
    </tr>
    <tr>
        <td align="center" bgcolor="#ffffff">
            <div style="width: 100%; max-width: 600px; height: 100px; background-color: #39afa8; display: table; padding-bottom: 20px;">
                <div>
                    <p style="color: white; font-size: 150%"><b>JOIN OUR TEAM</b></p>
                </div>
                <div>
                    <p style="color: white; font-size: 100%">Check our Aghan Promoters Blog for new publications</p>
                </div>
                <div>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr align="center">
                            <td>
                                <a href="https://www.facebook.com/profile.php?id=61557114009922"><img src="https://i.ibb.co/4Z0LDK9/1.png" width="8%" style="display: block; margin: 0 auto" alt="Logo" /></a>
                            </td>
                        </tr>
                    </table>
                </div>
                <div>
                    <p style="color: white; font-size: 100%">Click here to share your Aghan Promoters story, photos, and videos with the world!</p>
                </div>
                <div>
                    <p style="color: white; font-size: 160%"><b>AGHAN PROMOTERS LLP</b></p>
                </div>
                <div>
                    <p style="color: white; font-size: 105%">NO.1/198, Middle Street, Kiliyur & Post, Ulundurpet Taluk,</p>
                </div>
                <div>
                    <p style="color: white; font-size: 105%">Kallakurichi District, Tamilnadu, India - 606102</p>
                </div>
                <div style="padding-top: 20px">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr style="font-size: 100%" align="center">
                            <td style="width: 33.33%">
                                <a style="text-decoration: none; color: black" href="https://aghan.in/">
                                    <img src="https://i.ibb.co/cYMpqRK/8.png" width="30" height="30" alt="Logo" />
                                </a>
                            </td>
                            <td style="width: 33.33%">
                                <a style="text-decoration: none; color: black" href="tel:+917598818884">
                                    <img src="https://i.ibb.co/0KPCM7c/9.png" width="30" height="30" alt="Logo" />
                                </a>
                            </td>
                            <td style="width: 33.33%">
                                <a style="text-decoration: none; color: black" href="https://aghan.in/">
                                    <img src="https://i.ibb.co/Sw9FdSc/10.png" width="30" height="30" alt="Logo" />
                                </a>
                            </td>
                        </tr>
                        <tr style="font-size: 90%" align="center">
                            <td style="width: 33.33%">
                                <a style="text-decoration: none; color: black;" href="https://aghan.in/"><b>https://aghan.in/</b></a>
                            </td>
                            <td style="width: 33.33%">
                                <a style="text-decoration: none; color: black;" href="mailto:support@aghan.in"><b>support@aghan.in</b></a>
                            </td>
                            <td style="width: 33.33%">
                                <br />
                                <a style="text-decoration: none; color: black;" href="tel:+917598818884"><b>+91 75988 18884</b></a>
                                <br />
                                <a style="text-decoration: none; color: black;" href="tel:+917598818885"><b>+91 75988 18885</b></a>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        </td>
    </tr>
</table>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Upgrade email sent to ${userEmail} for ${boardType} board.`);
    } catch (error) {
        console.error("Error sending board upgrade email:", error);
    } finally {
        client.release();
    }
}

async function isUserOnSilverOrHigherBoard(userId) {
    const client = await pgPool.connect();
    try {
        // Use parameterized query for PostgreSQL
        const { rows: boards } = await client.query(
            'SELECT 1 FROM boards WHERE "userid" = $1 AND "boardtype" IN ($2, $3, $4, $5, $6) AND "status" = $7',
            [userId, "SILVER", "GOLD", "DIAMOND", "PLATINUM", "KING", "ACTIVE"]
        );
        return boards.length > 0;
    } catch (error) {
        console.error("Error checking user board status:", error);
        throw error;
    } finally {
        client.release();
    }
}

async function getSilverBoardParent(userId) {
    const client = await pgPool.connect();
    try {
        const [rows] = await client.query(
            `SELECT userid FROM silverBoardGenealogy 
             WHERE member1 = ? OR member2 = ? OR member3 = ? OR member4 = ?`,
            [userId, userId, userId, userId]
        );

        return rows.length > 0 ? rows[0].userId : null;
    } catch (error) {
        console.error('Error fetching Silver Board parent:', error);
        throw error;
    }
}

async function getSilverBoardLevelIncomeBalance(userId) {
    const client = await pgPool.connect();
    try {
        // Use parameterized query for PostgreSQL
        const { rows: user } = await client.query(
            'SELECT "silver_board_income" FROM "users" WHERE "user_id" = $1',
            [userId]
        );

        if (!user || user.length === 0) {
            console.log("User not found:", userId);
            return 0; // Or handle appropriately
        }

        return user[0].silver_board_income; // Return the correct property (balance)
    } catch (error) {
        console.error("Error getting Silver Board level income balance:", error);
        throw error; // Re-throw the error to be handled higher up
    } finally {
        client.release();
    }
}

async function upgradeSilverToGold(userId) {
    const client = await pgPool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            'UPDATE users SET gold_board_income = gold_board_income + $1 WHERE user_id = $2',
            [SILVER_TO_GOLD_UPGRADE_AMOUNT, userId]
        );

        // Update/create the Gold Board record
        // First, check if a gold board record exists and update if found, otherwise insert a new record
        const { rows: goldBoard } = await client.query(
            'SELECT 1 FROM "boards" WHERE "userid" = $1 AND "boardtype" = $2',
            [userId, 'GOLD']
        );

        if (goldBoard.length > 0) {
            // Update existing gold board record
            await client.query(
                'UPDATE "boards" SET "status" = $1 WHERE "userid" = $2 AND "boardtype" = $3',
                ['ACTIVE', userId, 'GOLD']
            );
        } else {
            // Create new gold board record
            await client.query(
                'INSERT INTO "boards" ("userid", "boardtype", "status") VALUES ($1, $2, $3)',
                [userId, 'GOLD', 'ACTIVE']
            );
        }

        await client.query('COMMIT');
        console.log('User upgraded from Silver to Gold board:', userId);

    } catch (error) {
        console.error('Error upgrading to Gold Board:', error);
        await client.query('ROLLBACK');
        throw error; // Re-throw the error
    } finally {
        client.release();
    }
}

async function calculateLevelIncomeForBoard(userId, boardType) {
    const client = await pgPool.connect();
    try {
        // Fetch income plan
        const { rows: plan } = await client.query(
            'SELECT * FROM level_income_plan WHERE boardname = $1',
            [boardType]
        );

        if (plan.length === 0) {
            console.error(`No income plan found for board: ${boardType}`);
            return []; // Return empty array if plan not found
        }

        const levelIncomes = [];
        const boardGenealogyTable = `${boardType.toLowerCase()}boardgenealogy`;

        const { rows: genealogyRows } = await client.query(
            `SELECT * FROM ${boardGenealogyTable} WHERE user_id = $1`,
            [userId]
        );

        if (!genealogyRows || genealogyRows.length === 0) {
            console.log(`Genealogy data not found for user ${userId} in ${boardType} board.`);
            return []; // Return empty array if no genealogy data
        }

        const genealogyData = genealogyRows[0];

        for (let level = 1; level <= 5; level++) {
            const levelPercentage = parseFloat(plan[0][`level${level}`]) || 0;
            const referralsAtLevel = getReferralsAtLevelFromGenealogy(genealogyData, level);

            for (const referralId of referralsAtLevel) {
                if (referralId) { // Check if referralId exists.  If null, skip this referral
                    const levelIncome = (REGISTRATION_FEE * levelPercentage) / 100;
                    levelIncomes.push({
                        referrerId: userId, // Referrer is always the user triggering the distribution
                        levelIncome,
                        level,
                        userId: referralId
                    });
                }
            }
        }

        return levelIncomes;
    } catch (error) {
        console.error(`Error calculating level income for ${boardType}:`, error);
        throw error; // Re-throw the error to be handled by the calling function
    } finally {
        client.release();
    }
}

function getReferralsAtLevelFromGenealogy(genealogyData, level) {
    const memberKey = `member${level}`;
    return genealogyData[memberKey] ? [genealogyData[memberKey]] : [];
}

async function findAndPlaceUserInSilverBoard(userId) {
    console.log('Placing user in Silver Board:', userId);
    const client = await pgPool.connect();
    try {
        await client.query('BEGIN'); // Start a transaction

        // Step 1: Insert the user into the silverboardgenealogy table
        await client.query(
            `INSERT INTO silverboardgenealogy (user_id) VALUES ($1)`,
            [userId]
        );

        // Step 2: Find the first available top-level parent with empty slots
        const result = await client.query(
            `SELECT user_id, member1, member2, member3, member4, member5
             FROM silverboardgenealogy
             WHERE (member1 IS NULL
                 OR member2 IS NULL
                 OR member3 IS NULL
                 OR member4 IS NULL
                 OR member5 IS NULL)
             ORDER BY id
             LIMIT 1`
        );

        console.log(result.rows);

        if (result.rows.length > 0) {
            const parentRow = result.rows[0];

            // Loop through the member slots (member1 to member6)
            for (let i = 1; i <= 5; i++) {
                const memberSlot = `member${i}`;
                if (parentRow[memberSlot] === null) {
                    // Update the first available member slot under the top-level parent
                    await client.query(
                        `UPDATE silverboardgenealogy 
                         SET ${memberSlot} = $1 
                         WHERE user_id = $2`,
                        [userId, parentRow.user_id]
                    );

                    console.log(`User ${userId} placed under user ${parentRow.user_id} in Silver Board slot ${memberSlot}`);

                    // Add the Silver Board income to the parent's balance
                    await client.query(
                        `UPDATE users
                         SET silver_board_income = COALESCE(silver_board_income, 0) + $1
                         WHERE user_id = $2`,
                        [SILVER_BOARD_LEVEL_INCOME, parentRow.user_id]
                    );

                    await client.query(
                        `UPDATE boards
                         SET earnings = COALESCE(earnings, 0) + $1
                         WHERE userid = $2`,
                        [SILVER_BOARD_LEVEL_INCOME, parentRow.user_id]
                    );

                    console.log(`Silver Board income of ₹${SILVER_BOARD_LEVEL_INCOME} credited to user ${parentRow.user_id}`);

                    // Commit the transaction after placing the user and updating the income
                    await client.query('COMMIT');
                    return; // Exit after placing the user
                }
            }
        } else {
            // No available slots found for any user
            console.log('No available slots found for the new user in Silver Board.');
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK'); // Rollback on any error
        console.error('Error placing user in Silver Board:', error);
        throw error; // Re-throw the error for the calling function to handle
    } finally {
        client.release(); // Release the client back to the pool
    }
}


async function buildSilverBoardTree(userId) { // Modified to fetch all users, not just under the logged-in user
    const client = await pgPool.connect();
    try {
        // Fetch all silverboard members from the database
        const { rows: silverBoardMembers } = await client.query('SELECT * FROM silverboardgenealogy                                                     CCC                                                                                                                                                         ');

        if (!silverBoardMembers || silverBoardMembers.length === 0) {
            return { userId: null, children: [] }; // Return an empty tree if no Silver Board members exist
        }

        // Find the root user, which has no parent
        const rootUserId = silverBoardMembers.find(member => !hasParent(silverBoardMembers, member.user_id)).user_id;

        // Build the tree recursively from the root
        const tree = buildSilverBoardTreeRecursive(silverBoardMembers, rootUserId);

        return tree;
    } catch (error) {
        console.error("Error building Silver Board tree:", error);
        throw error;
    } finally {
        client.release(); // Ensure the client is released back to the pool
    }
}

function hasParent(referrals, userId) {
    for (const referral of referrals) {
        for (let i = 1; i <= 5; i++) {
            if (referral[`member${i}`] === userId) {
                return true;
            }
        }
    }
    return false;
}

function buildSilverBoardTreeRecursive(referrals, parentId, visited = new Set()) {
    if (visited.has(parentId)) {
        return null;
    }
    visited.add(parentId);


    const parent = referrals.find(member => member.userId === parentId);
    if (!parent) {
        return null;
    }



    const children = [];
    for (let i = 1; i <= MAX_DIRECT_REFERRALS; i++) {  // Use MAX_DIRECT_REFERRALS constant
        const childId = parent[`member${i}`];
        if (childId) {
            const child = buildSilverBoardTreeRecursive(referrals, childId, visited);
            if (child) {  // Check if child is not null (due to circular references or missing data)
                children.push(child);
            }
        }
    }


    return {
        userId: parent.userId,
        children: children
    };
}

async function upgradeUserBoard(userId, currentBoard, targetBoard, upgradeAmount) {
    const client = await pgPool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            'UPDATE users SET rebirth_balance = rebirth_balance - $1 WHERE user_id = $2',
            [upgradeAmount, userId]
        );
        const targetBoardIncomeColumn = `${targetBoard.toLowerCase()}_upgrade`;
        await client.query(
            `UPDATE users SET ${targetBoardIncomeColumn} = ${targetBoardIncomeColumn} + $1 WHERE user_id = $2`,
            [upgradeAmount, userId]
        );

        await client.query(
            'INSERT INTO wallettransactions (transactionid, fromid, amount, transactiontype) VALUES (gen_random_uuid(), $1, $2, $3)',
            [userId, upgradeAmount, `${targetBoard}_BOARD_UPGRADE`]
        );

        const { rowCount } = await client.query(
            'SELECT 1 FROM "boards" WHERE "userid" = $1 AND "boardtype" = $2',
            [userId, targetBoard]
        );

        if (rowCount > 0) {
            await client.query(
                'UPDATE "boards" SET "status" = $1 WHERE "userid" = $2 AND "boardtype" = $3',
                ['ACTIVE', userId, targetBoard]
            );
        } else {
            await client.query(
                'INSERT INTO "boards" ("userid", "boardtype", "status") VALUES ($1, $2, $3)',
                [userId, targetBoard, 'ACTIVE']
            );
        }

        await client.query('COMMIT');
        console.log(`User upgraded to ${targetBoard} board:`, userId);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error upgrading to ${targetBoard} Board:`, error);
        throw error;
    } finally {
        client.release();
    }
}


async function distributeSilverBoardLevelIncome(userId, levelIncome) {
    const client = await pgPool.connect();
    try {
        await client.query('BEGIN'); // Start transaction

        // 1. Fetch Silver Board Genealogy Data
        const { rows: genealogyRows } = await client.query(
            'SELECT * FROM silverboardgenealogy WHERE user_id = $1',
            [userId]
        );

        if (genealogyRows.length === 0) {
            throw new Error(`Silver Board genealogy not found for user: ${userId}`);
        }

        const genealogyData = genealogyRows[0];

        // 2. Fetch Level Income Plan
        const { rows: planRows } = await client.query(
            'SELECT * FROM level_income_plan WHERE boardname = $1',
            ['Silver']
        );

        if (!planRows || planRows.length === 0) {
            throw new Error('Level income plan not found for Silver Board.');
        }
        const silverPlan = planRows[0];


        // 3. Iterate through Genealogy Levels and Distribute Income
        for (let level = 1; level <= 5; level++) {
            const memberIds = getReferralsAtLevelFromGenealogy(genealogyData, level); // Helper function (see below)
            const levelPercentage = parseFloat(silverPlan[`level${level}`]) || 0; //Get percentage from plan

            for (const memberId of memberIds) {
                if (memberId) { //Check if memberId exists
                    try {
                        const levelIncome = (REGISTRATION_FEE * levelPercentage) / 100;
                        await client.query(
                            `UPDATE users SET silver_board_income = COALESCE(silver_board_income, 0) + $1 WHERE user_id = $2`,
                            [levelIncome, memberId]
                        );

                        await client.query(
                            `UPDATE boards SET earnings = COALESCE(earnings, 0) + $1 WHERE userid = $2 AND boardtype = 'SILVER'`,
                            [levelIncome, memberId]
                        );

                        await client.query(
                            `INSERT INTO wallettransactions (transactionid, fromid, amount, transactiontype, toid, level) 
                             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
                            [userId, levelIncome, 'SILVER_BOARD_LEVEL_INCOME', memberId, level]
                        );
                        console.log(`Level ${level} income of ₹${levelIncome} credited to user ${memberId} from user ${userId}.`);
                    } catch (error) {
                        console.error(`Error distributing income at level ${level} to user ${memberId}:`, error);
                        // Consider whether to rollback the entire transaction or continue processing others
                    }
                }
            }
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error distributing Silver Board level income:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Helper function to extract referrals from board genealogy data (same as before)
function getReferralsAtLevelFromGenealogy(genealogyData, level) {
    const memberKey = `member${level}`;
    return genealogyData[memberKey] ? [genealogyData[memberKey]] : [];
}


async function createBoard(userId, boardType) {
    try {
        await pool.query('INSERT INTO boards (UserID, BoardType) VALUES (?, ?)', [userId, boardType]);
        console.log(`${boardType} Board created for user ${userId}`);
    } catch (error) {
        console.error(`Error creating ${boardType} Board:`, error);
        throw error;
    }
}

async function creditDirectLevelIncome(referrerId, amount, fromUserId, boardType) {
    const client = await pgPool.connect();
    try {
        const incomeColumn = boardType ? `${boardType.toLowerCase()}_board_income` : 'direct_referral_income'; // Determine income column

        await client.query(
            `UPDATE users SET ${incomeColumn} = ${incomeColumn} + $1 WHERE user_id = $2`, // Use correct column and parameterized queries
            [amount, referrerId]
        );

        console.log(`Credited ${amount} to referrer ${referrerId} from user ${fromUserId} for ${boardType || 'Direct Referral'}`);
    } catch (error) {
        console.error('Error crediting referral income:', error);
        throw error;
    } finally {
        client.release(); // Ensure the client is released back to the pool
    }
}


async function distributeBoardLevelIncome(userId, boardType) {
    const client = await pgPool.connect();
    try {
        await client.query('BEGIN'); // Begin transaction

        // 1. Fetch Level Income Plan (This is the key change)
        const { rows: planRows } = await client.query(
            'SELECT * FROM level_income_plan WHERE boardname = $1',
            [boardType]
        );

        if (!planRows || planRows.length === 0) {
            throw new Error(`Level income plan not found for ${boardType} Board.`);
        }
        const boardPlan = planRows[0]; // Use boardPlan instead of silverPlan

        // 2. Calculate Level Income based on the fetched plan
        const levelIncomes = [];
        const boardGenealogyTable = `${boardType.toLowerCase()}boardgenealogy`;

        const { rows: genealogyRows } = await client.query(
            `SELECT * FROM ${boardGenealogyTable} WHERE user_id = $1`,
            [userId]
        );

        if (!genealogyRows || genealogyRows.length === 0) {
            console.log(`Genealogy data not found for user ${userId} in ${boardType} board.`);
            return [];
        }

        const genealogyData = genealogyRows[0];

        for (let level = 1; level <= 5; level++) {
            const levelPercentage = parseFloat(boardPlan[`level${level}`]) || 0; // Use boardPlan
            const referralsAtLevel = getReferralsAtLevelFromGenealogy(genealogyData, level);

            for (const referralId of referralsAtLevel) {
                if (referralId) {
                    const levelIncome = (REGISTRATION_FEE * levelPercentage) / 100;
                    levelIncomes.push({
                        referrerId: userId,
                        levelIncome,
                        level,
                        userId: referralId
                    });
                }
            }
        }


        // 3. Distribute Income and Record Transactions (remains largely the same)
        await Promise.all(levelIncomes.map(async ({ referrerId, levelIncome, level, userId: referralId }) => {
            try {
                const incomeColumn = `${boardType.toLowerCase()}_board_income`;
                await client.query(
                    `UPDATE users SET ${incomeColumn} = COALESCE(${incomeColumn}, 0) + $1 WHERE user_id = $2`,
                    [levelIncome, referrerId]
                );

                await client.query(
                    `INSERT INTO wallettransactions (transactionid, fromid, amount, transactiontype, toid, level)
                     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
                    [referralId, levelIncome, `${boardType}_BOARD_LEVEL_INCOME`, referrerId, level]
                );
                console.log(`Level ${level} income of ₹${levelIncome} credited to referrer ${referrerId} for user ${referralId} in ${boardType} board.`);
            } catch (error) {
                console.error(`Error distributing income at level ${level} to user ${referralId}:`, error);
            }
        }));

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error distributing level income for ${boardType} board:`, error);
        throw error;
    } finally {
        client.release();
    }
}

async function findAndPlaceUserInBoard(userId, boardType) {
    const client = await pgPool.connect();
    try {
        await client.query('BEGIN');
        const boardtype = boardType.toLowerCase()
        // Insert into board genealogy table
        await client.query(
            `INSERT INTO ${boardtype}boardgenealogy (user_id) VALUES ($1)`,
            [userId]
        );
        // Query to find empty slots in the board
        const { rows: emptySlotRows } = await client.query(
            `SELECT id, user_id, member1, member2, member3, member4, member5 
             FROM ${boardtype}boardgenealogy
             WHERE member1 IS NULL
                OR member2 IS NULL
                OR member3 IS NULL
                OR member4 IS NULL
                OR member5 IS NULL
             LIMIT 1`
        );

        if (boardType !== 'SILVER') { // Avoid duplicate transaction for silver board upgrade
            const amount = boardType === 'GOLD' ? GOLD_BOARD_LEVEL_INCOME :
                boardType === 'DIAMOND' ? DIAMOND_BOARD_LEVEL_INCOME :
                    boardType === 'PLATINUM' ? PLATINUM_BOARD_LEVEL_INCOME :
                        boardType === 'KING' ? KING_BOARD_LEVEL_INCOME : 0;

            // Insert transaction for board join
            await client.query(
                'INSERT INTO wallettransactions (transactionid, fromid, amount, transactiontype) VALUES ($1, $2, $3, $4)',
                [uuidv4(), userId, amount, `${boardType}_BOARD_JOIN`]
            );
        }

        // Place the user in the first available slot
        if (emptySlotRows.length > 0) {
            const emptySlotRow = emptySlotRows[0];
            const parentUserId = emptySlotRow.userId;

            for (let i = 1; i <= 5; i++) {
                const memberSlot = `member${i}`;
                if (emptySlotRow[memberSlot] === null) {
                    await client.query(
                        `UPDATE ${boardtype}boardgenealogy SET ${memberSlot} = $1 WHERE user_id = $2`,
                        [userId, parentUserId]
                    );
                    console.log(`User ${userId} placed under ${parentUserId} in ${boardType} Board slot ${memberSlot}`);
                    break;
                }
            }
        } else {
            console.log("No empty slots available in", boardType, "board");
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error placing user in ${boardType} Board:`, error);
        throw error;
    } finally {
        client.release();
    }
}

async function isUserOnBoard(userId, boardType) { // Generic board check
    const client = await pgPool.connect();
    try {
        const { rows } = await client.query(
            'SELECT 1 FROM boards WHERE userid = $1 AND boardtype = $2 AND status = $3',
            [userId, boardType, 'ACTIVE'] // Use PostgreSQL parameterized queries
        );
        return rows.length > 0; // Check if any row was returned
    } catch (error) {
        console.error(`Error checking user ${boardType} Board status:`, error);
        throw error;
    } finally {
        client.release(); // Always release the client back to the pool
    }
}

async function processUserBoardUpgrade(userId) {
    const client = await pgPool.connect();
    try {
        await client.query('BEGIN');

        const { rows: ancestorRows } = await client.query(`
            SELECT treelevel1, treelevel2, treelevel3, treelevel4
            FROM genealogy
            WHERE user_id = $1
        `, [userId]);

        if (!ancestorRows || ancestorRows.length === 0) {
            console.log("Genealogy data not found for user:", userId);
            return;
        }

        const ancestorLevels = Object.values(ancestorRows[0]).filter(Boolean);

        for (const ancestorId of ancestorLevels) {
            try {
                const { rows: userRows } = await client.query(
                    'SELECT * FROM users WHERE user_id = $1',
                    [ancestorId]
                );
                if (!userRows || userRows.length === 0) {
                    console.log(`User ${ancestorId} not found. Skipping upgrade.`);
                    continue;
                }

                const user = userRows[0];
                const { silver_board_income, gold_board_income, diamond_board_income, platinum_board_income } = user;

                if (platinum_board_income >= KING_BOARD_INCOME_THRESHOLD && !(await isUserOnBoard(ancestorId, 'KING', client))) {
                    await upgradeUserBoard(ancestorId, 'PLATINUM', 'KING', KING_BOARD_INCOME_THRESHOLD, client);
                    await findAndPlaceUserInBoard(ancestorId, 'KING', client);
                    await distributeBoardLevelIncome(ancestorId, 'KING', client);
                    await sendBoardUpgradeEmail(ancestorId, 'KING', client);
                } else if (diamond_board_income >= PLATINUM_BOARD_INCOME_THRESHOLD && !(await isUserOnBoard(ancestorId, 'PLATINUM', client))) {
                    await upgradeUserBoard(ancestorId, 'DIAMOND', 'PLATINUM', PLATINUM_BOARD_INCOME_THRESHOLD, client);
                    await findAndPlaceUserInBoard(ancestorId, 'PLATINUM', client);
                    await distributeBoardLevelIncome(ancestorId, 'PLATINUM', client);
                    await sendBoardUpgradeEmail(ancestorId, 'PLATINUM', client);
                } else if (gold_board_income >= DIAMOND_BOARD_INCOME_THRESHOLD && !(await isUserOnBoard(ancestorId, 'DIAMOND', client))) {
                    await upgradeUserBoard(ancestorId, 'GOLD', 'DIAMOND', DIAMOND_BOARD_INCOME_THRESHOLD, client);
                    await findAndPlaceUserInBoard(ancestorId, 'DIAMOND', client);
                    await distributeBoardLevelIncome(ancestorId, 'DIAMOND', client);
                    await sendBoardUpgradeEmail(ancestorId, 'DIAMOND', client);
                } else if (silver_board_income >= GOLD_BOARD_INCOME_THRESHOLD && !(await isUserOnBoard(ancestorId, 'GOLD', client))) {
                    await upgradeUserBoard(ancestorId, 'SILVER', 'GOLD', GOLD_BOARD_INCOME_THRESHOLD, client);
                    await findAndPlaceUserInBoard(ancestorId, 'GOLD', client);
                    await distributeBoardLevelIncome(ancestorId, 'GOLD', client);
                    await sendBoardUpgradeEmail(ancestorId, 'GOLD', client);
                }
            } catch (upgradeError) {
                console.error(`Error upgrading user ${ancestorId}:`, upgradeError);
            }
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error processing board upgrades:", error);
    } finally {
        client.release();
    }
}


async function countDescendants(userId) {
    try {
        const [result] = await pool.query(
            `SELECT COUNT(*) as total FROM users WHERE introducer_id = ?`,
            [userId]
        );
        console.log(result)
        return result[0].total;
    } catch (error) {
        console.error('Error counting descendants:', error);
        throw error;
    }
}

app.post('/register', async (req, res) => {
    const client = await pgPool.connect();; // Start a transaction
    await client.query('BEGIN');;

    try {
        const {
            introducer_id,
            username,
            email,
            otp,
            address,
            city,
            mobile,
            country,
            state,
            password,
            confirmPassword
        } = req.body;
        console.log("@req.body", req.body)
        const requiredFields = ['username', 'email', 'otp', 'address', 'city', 'mobile', 'country', 'state', 'password', 'confirmPassword'];
        const nullFields = requiredFields.filter(field => req.body[field] === null);

        if (nullFields.length > 0) {
            const fieldsString = nullFields.join(', ');
            return res.status(400).json({ message: `Fields ${fieldsString} are required.` });
        }

        const effectiveIntroducerId = introducer_id || 'AP5678';
        const introducerExists = await validateIntroducerId(effectiveIntroducerId);
        if (!introducerExists) {
            return res.status(400).json({ message: 'Invalid Introducer ID' });
        }

        // Additional validation checks
        if (effectiveIntroducerId !== 'AP5678' && effectiveIntroducerId.length < 7) {
            return res.status(400).json({ message: 'Introducer Id must be at least 7 characters long.' });
        }

        if (username.length < 3) {
            return res.status(400).json({ message: 'Username must be at least 3 characters long' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address' });
        }

        if (otp.length !== 6 || isNaN(otp)) {
            return res.status(400).json({ message: 'Invalid OTP. OTP must be 6 digits.' });
        }

        if (mobile.length !== 10) {
            return res.status(400).json({ message: 'Invalid Mobile Number. Mobile Number must be 10 digits.' });
        }

        if (password.length < 5) {
            return res.status(400).json({ message: 'Password must be at least 5 characters long' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Verify OTP
        const regeneratedOTP = generateOTP(email);
        if (regeneratedOTP !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const user_id = await generateRandomId();
        console.log(user_id)
        // const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPassword = password;

        // Check if email already exists
        const existingUser = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Insert user into the database
        await client.query(
            `INSERT INTO users (user_id, introducer_id, username, email, address, city, mobile, country, state, password) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [user_id, effectiveIntroducerId, username, email, address, city, mobile, country, state, hashedPassword]
        );
        await findAndPlaceUser(user_id, effectiveIntroducerId);
        // Send email with user_id

        await updateAncestorLevelsInGenealogy(user_id);
        const mailOptions = {
            from: 'dirssp2002@gmail.com',
            to: email,
            subject: 'Your Aghan Promoters ID',
            html: `                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                <td align="center" bgcolor="#ffffff">
                    <table width="600" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td align="center" bgcolor="#000000">
                                <div style="width: 100%; max-width: 600px; height: 100px; background-color: #091023; display: table;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td align="start" style="width: 100%; height: 100%">
                                                <img src="https://i.ibb.co/bvY6L8Y/aghan-logo-english.png" width="30%" style="display: block; margin: 0 auto" alt="Logo" />
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center" bgcolor="#ffffff">
                    <div style="width: 100%; max-width: 600px; height: 500px; background-color: white; display: table;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 90px">
                            <tr>
                                <td align="center" style="width: 60%; height: 100%">
                                    <p style="color: black; text-align: center; font-size: 160%"><b>Welcome to</b></p>
                                    <p style="color: black; text-align: center; font-size: 160%"><b>AGHAN PROMOTERS</b></p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="width: 60%; height: 100%">
                                    <p style="color: black; text-align: center; font-size: 120%">Your registration is successful.</p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="width: 60%; height: 100%">
                                    <div style="color: black; text-align: center; font-size: 120%">
                                        Your Aghan Promoters ID is:
                                        <span style="background-color: #f15529; color: white; padding: 5px; border-radius: 5px;"><b>${user_id}</b></span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="width: 60%; height: 100%">
                                    <p style="color: black; text-align: center; font-size: 120%">Please keep this ID safe for login.</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
            <tr>
                <td align="center" bgcolor="#ffffff">
                    <div style="width: 100%; max-width: 600px; height: 100px; background-color: #39afa8; display: table; padding-bottom: 20px;">
                        <div>
                            <p style="color: white; font-size: 150%"><b>JOIN OUR TEAM</b></p>
                        </div>
                        <div>
                            <p style="color: white; font-size: 100%">Check our Aghan Promoters Blog for new publications</p>
                        </div>
                        <div>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr align="center">
                                    <td>
                                        <a href="https://www.facebook.com/profile.php?id=61557114009922"><img src="https://i.ibb.co/4Z0LDK9/1.png" width="8%" style="display: block; margin: 0 auto" alt="Logo" /></a>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        <div>
                            <p style="color: white; font-size: 100%">Click here to share your Aghan Promoters story, photos, and videos with the world!</p>
                        </div>
                        <div>
                            <p style="color: white; font-size: 160%"><b>AGHAN PROMOTERS LLP</b></p>
                        </div>
                        <div>
                            <p style="color: white; font-size: 105%">NO.1/198, Middle Street, Kiliyur & Post, Ulundurpet Taluk,</p>
                        </div>
                        <div>
                            <p style="color: white; font-size: 105%">Kallakurichi District, Tamilnadu, India - 606102</p>
                        </div>
                        <div style="padding-top: 20px">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr style="font-size: 100%" align="center">
                                    <td style="width: 33.33%">
                                        <a style="text-decoration: none; color: black" href="https://aghan.in/">
                                            <img src="https://i.ibb.co/cYMpqRK/8.png" width="30" height="30" alt="Logo" />
                                        </a>
                                    </td>
                                    <td style="width: 33.33%">
                                        <a style="text-decoration: none; color: black" href="tel:+917598818884">
                                            <img src="https://i.ibb.co/0KPCM7c/9.png" width="30" height="30" alt="Logo" />
                                        </a>
                                    </td>
                                    <td style="width: 33.33%">
                                        <a style="text-decoration: none; color: black" href="https://aghan.in/">
                                            <img src="https://i.ibb.co/Sw9FdSc/10.png" width="30" height="30" alt="Logo" />
                                        </a>
                                    </td>
                                </tr>
                                <tr style="font-size: 90%" align="center">
                                    <td style="width: 33.33%">
                                        <a style="text-decoration: none; color: black;" href="https://aghan.in/"><b>https://aghan.in/</b></a>
                                    </td>
                                    <td style="width: 33.33%">
                                        <a style="text-decoration: none; color: black;" href="mailto:support@aghan.in"><b>support@aghan.in</b></a>
                                    </td>
                                    <td style="width: 33.33%">
                                        <br />
                                        <a style="text-decoration: none; color: black;" href="tel:+917598818884"><b>+91 75988 18884</b></a>
                                        <br />
                                        <a style="text-decoration: none; color: black;" href="tel:+917598818885"><b>+91 75988 18885</b></a>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>
                </table>`
        };
        await transporter.sendMail(mailOptions);

        await client.query('COMMIT');

        res.status(201).json({ message: 'User registered successfully. Your ID has been sent to your email.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Registration failed. Please try again later.' });
    } finally {
        client.release();
    }
});

app.get('/tree/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;
        console.log(userId)
        const genealogyTree = await getGenealogyTree(userId); // Use the improved function below

        if (!genealogyTree) {
            return res.status(404).json({ message: "User not found or no genealogy data available." });
        }

        res.json({ genealogyTree });

    } catch (error) {
        console.error('Error fetching genealogy tree:', error);
        res.status(500).json({ message: 'Failed to fetch genealogy tree.' });
    }
});


app.get('/silver-board-tree', authenticateToken, async (req, res) => {
    try {
        const silverBoardTree = await buildSilverBoardTree(); // No userId passed
        res.json({ silverBoardTree });
    } catch (error) {
        console.error("Error fetching silver board tree:", error);
        res.status(500).json({ message: "Failed to fetch silver board tree" });
    }
});


app.post('/login', async (req, res) => {
    const client = await pgPool.connect();
    try {
        const { id, password } = req.body;
        console.log(id, password);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID is required.',
                alertType: 'warning'
            });
        }
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required.',
                alertType: 'warning'
            });
        }

        // Query the user by ID
        const result = await client.query('SELECT * FROM users WHERE user_id = $1', [id]);
        const user = result.rows[0]; // Access the first row
        console.log(user);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid ID or password.',
                alertType: 'danger'
            });
        }

        // Compare the password
        if (password !== user.password) { // Direct password comparison
            return res.status(401).json({
                success: false,
                message: 'Invalid ID or password.',
                alertType: 'danger'
            });
        }

        // Create JWT payload and token
        const payload = {
            userId: user.user_id,
        };
        const token = jwt.sign(payload, JWT_SECRET);

        req.session.token = token;

        try {
            // Log user login
            const ipAddress = req.ip;
            const browser = req.headers['user-agent'];
            await client.query(
                'INSERT INTO user_logs (user_id, username, ip_address, browser) VALUES ($1, $2, $3, $4)',
                [user.user_id, user.username, ipAddress, browser]
            );
            console.log(`User ${user.user_id} logged in successfully.`);
        } catch (logErr) {
            // Handle logging error
            console.error('Error logging user login:', logErr);
        }

        // Send successful login response
        res.status(200).json({
            success: true,
            message: 'Login successful!',
            alertType: 'success',
            token: token
        });

    } catch (error) {
        console.error('Error during login:', error);

        try {
            // Log failed login attempt
            const ipAddress = req.ip;
            const browser = req.headers['user-agent'];
            await client.query(
                'INSERT INTO user_logs (user_id, username, ip_address, browser) VALUES ($1, $2, $3, $4)',
                [id, id, ipAddress, browser]
            );
            console.error(`Failed login attempt for user ID: ${id}. Error:`, error);
        } catch (logErr) {
            console.error('Error logging failed login:', logErr);
        }

        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again later.',
            alertType: 'danger'
        });
    } finally {
        client.release(); // Always release the client
    }
});

app.post('/admin/login', async (req, res) => {
    const client = await pgPool.connect();
    console.log(client)
    try {
        const { id, password } = req.body;
        console.log(id, password)

        if (!id || !password) {
            return res.status(400).json({
                success: false,
                message: 'ID and Password are required fields.',
                alertType: 'warning'
            });
        }

        // Use pgSQL parameter substitution ($1 for the id)
        const result = await client.query('SELECT * FROM users WHERE user_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid ID or password.',
                alertType: 'danger'
            });
        }

        const user = result.rows[0];
        // const passwordMatch = await bcrypt.compare(password, user.password);
        // console.log(passwordMatch)
        console.log(user)

        if (password === user.password && user.role === 'admin') {
            const payload = {
                userId: user.user_id,
                role: user.role
            };
            const token = jwt.sign(payload, JWT_SECRET);

            req.session.token = token;

            res.status(200).json({
                success: true,
                message: 'Admin login successful!',
                alertType: 'success',
                token: token,
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid admin credentials.',
                alertType: 'danger'
            });
        }

    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({
            success: false,
            message: 'Admin login failed. Please try again later.',
            alertType: 'danger'
        });
    }
});

async function validateIntroducerId(introducerId) {
    const client = await pgPool.connect(); // Get a connection from the pool
    try {
        // Querying the database for the introducer's username using pgSQL
        const result = await client.query('SELECT username FROM users WHERE user_id = $1', [introducerId]);

        // If the introducer exists, return their username
        return result.rows.length > 0 ? result.rows[0].username : null;
    } catch (error) {
        console.error('Error validating introducer ID:', error); // Log errors
        throw error; // Rethrow to handle appropriately
    } finally {
        client.release(); // Always release the client back to the pool
    }
}

app.get('/validate-introducer', async (req, res) => {
    const introducerId = req.query.introducerId;

    try {
        const username = await validateIntroducerId(introducerId);
        res.json({ exists: !!username, username });
    } catch (error) {
        console.error('Error validating introducer ID:', error);
        res.status(500).json({ error: 'Failed to validate introducer ID' });
    }
});

app.get('/validate-id', async (req, res) => {
    const id = req.query.id;

    if (!id) {
        return res.status(400).json({ message: 'ID is required' });
    }

    try {
        const username = await validateIntroducerId(id);
        res.json({ exists: !!username, username });
    } catch (error) {
        console.error('Error validating User ID:', error);
        res.status(500).json({ error: 'Failed to validate introducer ID' });
    }
});

app.get('/topup-history', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        console.log(userId);
        await client.query('BEGIN'); // Begin transaction

        // Fetch top-up history with PostgreSQL query syntax
        const result = await client.query(
            'SELECT * FROM user_topup WHERE user_id = $1 ORDER BY topup_date DESC',
            [userId] // Use $1 for parameterized query
        );

        console.log(result.rows[0]); // Log the result

        // Commit the transaction (although not strictly needed for a SELECT query)
        await client.query('COMMIT');

        // Send response with history
        res.json({ history: result.rows });

    } catch (error) {
        console.error('Error fetching top-up history:', error);
        // Rollback in case of an error
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Failed to fetch top-up history' });
    } finally {
        // Release the connection back to the pool
        client.release();
    }
});



app.get('/personal', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        // Use $1 for parameterized queries in PostgreSQL
        const result = await client.query('SELECT * FROM users WHERE user_id = $1', [req.user.userId]);

        const user = result.rows[0]; // Get the first user from the result rows
        console.log(user);

        res.status(200).json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data.'
        });
    } finally {
        client.release(); // Release the connection back to the pool
    }
});


app.post('/add-funds', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const { amount, transaction_id } = req.body;

        if (!amount || !transaction_id) {
            return res.status(400).json({ message: 'Amount and Transaction ID are required.' });
        }

        const requestId = uuidv4();

        // Adjusted for PostgreSQL: Use $1, $2, etc., for parameterized queries
        const result = await client.query(
            'INSERT INTO add_funds (user_id, amount, transaction_id, request_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, amount, transaction_id, requestId]
        );

        // In PostgreSQL, we check if any row is inserted by checking the length of the result.rows array
        if (result.rowCount === 1) {
            res.status(201).json({ message: 'Add funds request submitted successfully!' });
        } else {
            res.status(500).json({ message: 'Failed to submit add funds request.' });
        }

    } catch (error) {
        console.error('Error adding funds:', error);
        res.status(500).json({ message: 'Add funds request failed. Please try again later.' });
    } finally {
        client.release(); // Release the connection back to the pool
    }
});

app.post('/admin/add-funds', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const { userId, amount } = req.body;

        // Input validation
        if (!userId || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json({ message: 'Invalid user ID or amount.' });
        }

        // Check if user exists
        const userExistsResult = await client.query('SELECT 1 FROM users WHERE user_id = $1', [userId]);
        if (userExistsResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        await client.query('BEGIN'); // Start transaction

        try {
            // Insert into add_funds table with status 'approved' (since it's an admin action)
            const addFundsResult = await client.query(
                'INSERT INTO add_funds (user_id, amount, transaction_id, status) VALUES ($1, $2, gen_random_uuid(), $3) RETURNING id',
                [userId, amount, 'approved']
            );

            const addFundsId = addFundsResult.rows[0].id;

            //Record the transaction
            await client.query(
                'INSERT INTO wallettransactions (transactionid, fromid, amount, transactiontype, toid, addFundsId) VALUES (gen_random_uuid(), \'admin\', $1, \'FUND_TRANSFER\', $2, $3)',
                [amount, userId, addFundsId]
            );

            //Update the user's fund income only AFTER the add_funds entry is successful
            await client.query(
                'UPDATE users SET fund_income = fund_income + $1 WHERE user_id = $2',
                [amount, userId]
            );


            await client.query('COMMIT');
            res.json({ message: 'Funds added successfully.', addFundsId });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error adding funds:', error);

            // More specific error handling (e.g., check for unique constraint violation)
            if (error.code === '23505') {
                res.status(409).json({ message: 'Duplicate transaction ID' }); // Or similar
            } else {
                res.status(500).json({ message: 'Failed to add funds.' });
            }
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to add funds.' });
    } finally {
        client.release();
    }
});

app.get('/validate-email', async (req, res) => {
    const client = await pgPool.connect();
    const email = req.query.email;
    try {
        // Use PostgreSQL parameterized queries with $1
        const result = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);

        // Check if any rows were returned
        res.json({ exists: result.rowCount > 0 });
    } catch (error) {
        console.error('Error validating email:', error);
        res.status(500).json({ error: 'Failed to validate email' });
    } finally {
        client.release(); // Release the connection back to the pool
    }
});

app.get('/user', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;

        const query = `
            SELECT 
                u.*, 
                COALESCE(s.username, 'Aghan Promoters') AS sponsor_username,
                s.user_id as sponsor_id
            FROM users u
            LEFT JOIN users s ON u.introducer_id = s.user_id
            WHERE u.user_id = $1
        `;

        const result = await client.query(query, [userId]);

        const { rows: userBoards } = await client.query(`
            SELECT boardtype, earnings 
            FROM boards 
            WHERE userid = $1 AND status = 'ACTIVE'
        `, [userId]);

        let topBoard = null; // Initialize topBoard to null

        if (userBoards.length > 0) {
            const boardHierarchy = ['silver', 'gold', 'diamond', 'platinum', 'king'];
            const sortedBoards = userBoards.sort((a, b) => boardHierarchy.indexOf(a.boardtype) - boardHierarchy.indexOf(b.boardtype));
            topBoard = sortedBoards[0].boardtype;
        }

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const user = result.rows[0];

        res.json({ success: true, user: user, board: topBoard }); // board will be null if no active boards

    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user details.' });
    } finally {
        client.release();
    }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

function authorizeAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized.' });
    }
    next();
}

async function checkFullReferrals(userId) {
    // Check if the user has all six direct referrals
    const client = await pgPool.connect();
    try {
        // PostgreSQL uses $1 as a placeholder for parameters
        const result = await client.query(
            `SELECT member1, member2, member3, member4 FROM genealogy WHERE user_id = $1`,
            [userId]
        );

        if (result.rowCount === 0) {
            return false; // User not found in genealogy
        }

        // Verify if all direct referrals (member1 through member6) are filled
        const directReferrals = Object.values(result.rows[0]);
        if (directReferrals.some(member => member === null)) {
            return false; // Not all direct referrals are filled
        }

        // Check if each of the direct referrals also has all six members filled
        for (let memberId of directReferrals) {
            const nestedResult = await client.query(
                `SELECT member1, member2, member3, member4 FROM genealogy WHERE user_id = $1`,
                [memberId]
            );

            if (nestedResult.rowCount === 0 || Object.values(nestedResult.rows[0]).some(nestedMember => nestedMember === null)) {
                return false; // Nested members are not fully filled
            }
        }

        return true; // All conditions are met
    } catch (error) {
        console.error('Error checking full referrals:', error);
        return false; // In case of error, assume it's not fully filled
    } finally {
        client.release(); // Always release the connection back to the pool
    }
}

app.post('/user-topup', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();;
    try {
        const { userId, package } = req.body;
        const registrationFee = 5000;
        console.log("Request Body:", req.body);
        console.log("User from authentication:", req.user);

        if (!package || !userId) {
            return res.status(400).json({ message: 'Package and UserId are required.' });
        }

        await client.query('BEGIN');

        const checkResult = await client.query(`
            SELECT u.fund_income, af.status AS topup_status
            FROM users u
            LEFT JOIN add_funds af ON u.user_id = af.user_id
            WHERE u.user_id = $1
        `, [userId]);

        const { fund_income, topup_status } = checkResult.rows[0] || {};


        if (parseFloat(fund_income) >= 5900 && topup_status === 'approved') {
            const result = await client.query(
                'INSERT INTO user_topup (user_id, package) VALUES ($1, $2) RETURNING *',
                [userId, package]
            );

            console.log('Insert Result:', result);

            if (result.rowCount === 1) {
                const userData = await client.query(`SELECT introducer_id FROM users WHERE user_id = $1`, [userId]);

                if (userData.rowCount > 0 && userData.rows[0].introducer_id) {
                    const referrerId = userData.rows[0].introducer_id;

                    // Calculate direct referral income (10% of registration fee)
                    const directReferralIncome = registrationFee * 0.1;
                    await creditDirectReferralIncome(referrerId, directReferralIncome, userId);

                    // Handle re-birth income
                    await handleRebirthIncome(userId);

                    await handleRebirth(userId);

                    await handleSilverBoardUpgrade(userId);
                    await processUserBoardUpgrade(userId);

                    if (await isUserOnBoard(userId, 'SILVER')) {
                        await distributeSilverBoardLevelIncome(userId, SILVER_BOARD_LEVEL_INCOME);

                        const currentBalance = await getSilverBoardLevelIncomeBalance(userId);
                        if (currentBalance >= SILVER_TO_GOLD_UPGRADE_AMOUNT) {
                            await upgradeSilverToGold(userId);
                        }
                    }

                    const user = await client.query(
                        'SELECT rebirth_balance, rebirth_stage FROM users WHERE user_id = $1',
                        [userId]
                    );

                    if (!user.rows[0]) {
                        throw new Error(`User not found during Rebirth handling: ${userId}`);
                    }

                    const { rebirth_balance, rebirth_stage } = user.rows[0];
                    const rebirthThreshold = 5900;
                    let rebirthResult = null; // To store rebirthResult for later use
                    let expiryDateString = null; // To store expiry date string

                    if (rebirth_balance >= rebirthThreshold) {
                        if (rebirth_stage === 1) {
                            const expiryDate = new Date();
                            expiryDate.setDate(expiryDate.getDate() + 15);
                            expiryDateString = expiryDate.toISOString(); // Store date string

                            const rebirthInsert = await client.query(
                                'INSERT INTO rebirths (user_id, expiry_date) VALUES ($1, $2) RETURNING *',
                                [userId, expiryDateString]
                            );

                            if (rebirthInsert.rowCount > 0) {
                                await client.query('UPDATE users SET rebirth_stage = 2, rebirth_balance = 0.00 WHERE user_id = $1', [userId]);
                                scheduleBonus(userId, rebirthInsert.rows[0].id, expiryDate, connection);
                            } else {
                                // Log error, but don't throw in this block to avoid stopping other operations
                                console.error("Failed to create rebirth record.");
                            }
                        }
                    } else if (rebirth_stage === null || rebirth_stage === 0) {
                        await client.query('UPDATE users SET rebirth_stage = 1 WHERE user_id = $1', [userId]);
                    }

                }

                // Send success email (Implementation below)
                sendTopupSuccessEmail(userId, package)

                await client.query('COMMIT');
                res.status(201).json({
                    message: 'Top-up successful!',
                    topup: {
                        user_id: userId,
                        package: package,
                    }
                });
            } else {
                await client.query('ROLLBACK'); // Rollback if insert failed
                res.status(500).json({ message: 'Failed to process top-up (insert failed).' });
            }
        } else {
            res.status(200).json({ message: 'Fund income is less than 5900 or topup-status not approved' })
            return;
        }

    } catch (error) {
        console.error('Error during top-up:', error);
        res.status(500).json({ message: 'Top-up request failed. Please try again later.' });
    } finally {
        client.release(); // Always release the client back to the pool
    }
});

async function checkSixDirectReferrals(userId) {
    const client = await pgPool.connect();
    try {
        const result = await client.query(
            'SELECT COUNT(*) AS referralCount FROM users WHERE introducer_id = $1',
            [userId]
        );

        console.log("@sixref", result.rows[0]);
        return result.rows[0].referralcount >= 6;
    } catch (error) {
        console.error("Error checking direct referrals:", error);
        return false;
    } finally {
        client.release(); // Always release the client back to the pool
    }
}

async function creditRebirthBonus(userId) {
    const client = await pgPool.connect();
    try {
        await client.query(
            "UPDATE users SET total_balance = total_balance + 100000 WHERE user_id = $1",
            [userId]
        );
        console.log(`Rebirth bonus credited to ${userId}`);
    } catch (error) {
        console.error("Error crediting rebirth bonus:", error);
        throw error; // Re-throw the error to be handled by the transaction
    } finally {
        client.release(); // Ensure the client is released back to the pool
    }
}

async function scheduleBonus(userId, rebirthId, expiryDate) {
    const fifteenDaysLater = moment(expiryDate).add(15, 'days').toDate();

    setTimeout(async () => {
        const client = await pgPool.connect();
        try {
            await client.query('BEGIN');

            if (await checkBonusEligibility(userId, rebirthId)) {
                await creditRebirthBonus(userId);
                await client.query(
                    'UPDATE rebirths SET status = $1, claimed_date = CURRENT_TIMESTAMP WHERE rebirth_id = $2',
                    ['claimed', rebirthId]
                );

                // Insert into achieved_users
                const { level1Count, level2Count } = await countReferralsFromMemberN(rebirthId, client);
                await client.query(
                    'INSERT INTO achieved_users (user_id, level1_count, level2_count,status) VALUES ($1, $2, $3)',
                    [userId, level1Count, level2Count, 'E-BIKE Achieved']
                );

            } else {
                await redistributeBonus(userId, rebirthId, client);
            }

            await client.query('COMMIT');

        } catch (timeoutError) {
            await client.query('ROLLBACK');
            console.error("Error processing rebirth bonus in timeout:", timeoutError);
        } finally {
            client.release();
        }
    }, fifteenDaysLater - new Date());
}



async function isUserOnSilverBoard(userId) {
    try {
        const [boards] = await pool.query(
            'SELECT 1 FROM boards WHERE UserID = ? AND BoardType = "SILVER" AND Status = "ACTIVE"',
            [userId]
        );
        return boards.length > 0;
    } catch (error) {
        console.error("Error checking user Silver Board status:", error);
        throw error;
    }
}

async function redistributeBonus(userId, rebirthId) {
    const client = await pgPool.connect();
    try {
        // 1. Get the direct referrals of the user with the rebirth ID (level 1)
        const { rows: level1Referrals } = await client.query(
            'SELECT user_id FROM genealogy WHERE level1 = $1',
            [userId]
        );
        const level1Ids = level1Referrals.map(ref => ref.user_id);

        // 2. Calculate bonus per downline user:
        const bonusAmount = 100000; // Set to appropriate rebirth bonus
        const bonusPerUser = level1Ids.length > 0 ? (bonusAmount / level1Ids.length) : 0;

        if (bonusPerUser > 0) {  //  Distribute only if there are downline users
            // 3. Update the balance of each downline user
            for (const downlineId of level1Ids) {
                await client.query(
                    'UPDATE users SET total_balance = total_balance + $1 WHERE user_id = $2',
                    [bonusPerUser, downlineId]
                );

                // Record the transaction for each user
                await recordWalletTransaction(userId, bonusPerUser, 'REBIRTH_BONUS_REDISTRIBUTED', downlineId, client);
            }

            // 4. Update rebirth status (if needed - do this after successful distribution)
            await client.query(
                'UPDATE rebirths SET status = $1, redistributed_date = CURRENT_TIMESTAMP WHERE rebirth_id = $2',
                ['redistributed', rebirthId]
            );
        }

        console.log(`Bonus of ${bonusAmount} redistributed among ${level1Ids.length} users for rebirth ID ${rebirthId}.`);
    } catch (error) {
        console.error("Error redistributing bonus:", error);
        throw error; // Important: re-throw to trigger the rollback in the outer try...catch
    } finally {
        client.release(); // Release the client back to the pool
    }
}


async function sendTopupSuccessEmail(userId, packageName) {
    const client = await pgPool.connect();
    try {
        const { rows: user } = await client.query(
            'SELECT email, username FROM users WHERE user_id = $1',
            [userId]
        );
        const userEmail = user[0].email;

        const mailOptions = {
            from: 'dirssp2002@gmail.com',
            to: userEmail,
            subject: 'Aghan Promoters: Top-up Successful!',
            html: `
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td align="center" bgcolor="#ffffff">
                            <table width="600" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" bgcolor="#000000">
                                        <div style="width: 100%; max-width: 600px; height: 100px; background-color: #091023; display: table;">
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td align="start" style="width: 100%; height: 100%">
                                                        <img src="https://i.ibb.co/bvY6L8Y/aghan-logo-english.png" width="30%" style="display: block; margin: 0 auto" alt="Logo" />
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" bgcolor="#ffffff">
                            <div style="width: 100%; max-width: 600px; height: 500px; background-color: white; display: table;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 90px">
                                    <tr>
                                        <td align="center" style="width: 60%; height: 100%">
                                            <p style="color: black; text-align: center; font-size: 160%"><b>Congratulations, ${user[0].username}!</b></p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="width: 60%; height: 100%">
                                            <p style="color: black; text-align: center; font-size: 120%">Your Top-up is Successful</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="width: 60%; height: 100%">
                                            <div style="color: black; text-align: center; font-size: 120%">
                                                Package Name :
                                                <span style="background-color: #f15529; color: white; padding: 5px; border-radius: 5px;"><b>${packageName}</b></span>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="width: 60%; height: 100%">
                                            <p style="color: black; text-align: center; font-size: 120%">Enjoy our services</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" bgcolor="#ffffff">
                            <div style="width: 100%; max-width: 600px; height: 100px; background-color: #39afa8; display: table; padding-bottom: 20px;">
                                <div>
                                    <p style="color: white; font-size: 150%"><b>JOIN OUR TEAM</b></p>
                                </div>
                                <div>
                                    <p style="color: white; font-size: 100%">Check our Aghan Promoters Blog for new publications</p>
                                </div>
                                <div>
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr align="center">
                                            <td>
                                                <a href="https://www.facebook.com/profile.php?id=61557114009922"><img src="https://i.ibb.co/4Z0LDK9/1.png" width="8%" style="display: block; margin: 0 auto" alt="Logo" /></a>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                <div>
                                    <p style="color: white; font-size: 100%">Click here to share your Aghan Promoters story, photos, and videos with the world!</p>
                                </div>
                                <div>
                                    <p style="color: white; font-size: 160%"><b>AGHAN PROMOTERS LLP</b></p>
                                </div>
                                <div>
                                    <p style="color: white; font-size: 105%">NO.1/198, Middle Street, Kiliyur & Post, Ulundurpet Taluk,</p>
                                </div>
                                <div>
                                    <p style="color: white; font-size: 105%">Kallakurichi District, Tamilnadu, India - 606102</p>
                                </div>
                                <div style="padding-top: 20px">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr style="font-size: 100%" align="center">
                                            <td style="width: 33.33%">
                                                <a style="text-decoration: none; color: black" href="https://aghan.in/">
                                                    <img src="https://i.ibb.co/cYMpqRK/8.png" width="30" height="30" alt="Logo" />
                                                </a>
                                            </td>
                                            <td style="width: 33.33%">
                                                <a style="text-decoration: none; color: black" href="tel:+917598818884">
                                                    <img src="https://i.ibb.co/0KPCM7c/9.png" width="30" height="30" alt="Logo" />
                                                </a>
                                            </td>
                                            <td style="width: 33.33%">
                                                <a style="text-decoration: none; color: black" href="https://aghan.in/">
                                                    <img src="https://i.ibb.co/Sw9FdSc/10.png" width="30" height="30" alt="Logo" />
                                                </a>
                                            </td>
                                        </tr>
                                        <tr style="font-size: 90%" align="center">
                                            <td style="width: 33.33%">
                                                <a style="text-decoration: none; color: black;" href="https://aghan.in/"><b>https://aghan.in/</b></a>
                                            </td>
                                            <td style="width: 33.33%">
                                                <a style="text-decoration: none; color: black;" href="mailto:support@aghan.in"><b>support@aghan.in</b></a>
                                            </td>
                                            <td style="width: 33.33%">
                                                <br />
                                                <a style="text-decoration: none; color: black;" href="tel:+917598818884"><b>+91 75988 18884</b></a>
                                                <br />
                                                <a style="text-decoration: none; color: black;" href="tel:+917598818885"><b>+91 75988 18885</b></a>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </td>
                    </tr>
                </table>
            `
        };

        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    } finally {
        client.release(); // Release the client back to the pool
    }
}

app.get('/sponsor-income', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        // Query to get sponsor income with the necessary joins
        const sponsorIncomeResult = await client.query(`
            SELECT wt."transactionid", wt."transactiondate", wt."amount", 
                ru."username" AS "referralusername", ru."user_id" AS "referraluserid", 
                u."username" AS "userusername", u."user_id" AS "userid"    
            FROM "wallettransactions" wt
            JOIN "users" u ON wt."fromid" = u."user_id"  
            LEFT JOIN "users" ru ON wt."toid" = ru."user_id"  
            WHERE wt."transactiontype" = 'DIRECT_REFERRAL'
            AND wt."fromid" = $1                
            AND (LOWER(u."username") LIKE LOWER($2) OR LOWER(u."user_id") LIKE LOWER($3))
            ORDER BY wt."transactiondate" DESC
            LIMIT $4 OFFSET $5
        `, [userId, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset]);

        // Query to get total count for pagination
        const totalCountResult = await client.query(`
            SELECT COUNT(wt."transactionid") AS "total"  
            FROM "wallettransactions" wt
            LEFT JOIN "users" u ON wt."fromid" = u."user_id"  
            WHERE wt."transactiontype" = 'DIRECT_REFERRAL'
            AND wt."fromid" = $1                     
            AND (LOWER(u."username") LIKE LOWER($2) OR LOWER(u."user_id") LIKE LOWER($3) OR u."user_id" IS NULL)
        `, [userId, `%${searchTerm}%`, `%${searchTerm}%`]);

        const totalCount = totalCountResult.rows[0].total;

        res.json({
            sponsorIncome: sponsorIncomeResult.rows,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });

    } catch (error) {
        console.error('Error fetching sponsor income:', error);
        res.status(500).json({ message: 'Failed to fetch sponsor income' });
    } finally {
        client.release();
    }
});

app.get('/my-direct', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        // SQL query to get direct referrals with pagination and search
        const query = `
            SELECT u.user_id, u.username, u.mobile, u.status, u.created_at,
                   (SELECT COUNT(*) FROM genealogy g WHERE g.level1 = u.user_id) AS total_count,
                   (SELECT COUNT(*) FROM users ru WHERE ru.introducer_id = u.user_id) AS ref_count
            FROM users u
            WHERE u.introducer_id = $1 
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
            ORDER BY u.created_at DESC
            LIMIT $4 OFFSET $5
        `;

        const values = [userId, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const directReferralsResult = await client.query(query, values);


        // Separate query for total count (for pagination)
        const countQuery = `
        SELECT COUNT(*) AS total
        FROM users u
        WHERE u.introducer_id = $1
          AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
    `;
        const countValues = [userId, `%${searchTerm}%`, `%${searchTerm}%`];
        const totalCountResult = await client.query(countQuery, countValues);
        const totalCount = parseInt(totalCountResult.rows[0].total, 10);

        res.json({
            directReferrals: directReferralsResult.rows,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });

    } catch (error) {
        console.error('Error fetching direct referrals:', error);
        res.status(500).json({ message: 'Failed to fetch direct referrals' });
    } finally {
        client.release();
    }
});

app.get('/admin/add-funds-history', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        // Build the query dynamically
        let query = `
            SELECT 
                COUNT(*) OVER () AS total_count,  -- Total count for pagination
                af.id, 
                af.user_id, 
                u.username, 
                af.amount, 
                af.transaction_id, 
                af.created_at, 
                af.status
            FROM add_funds af
            JOIN users u ON af.user_id = u.user_id
        `;
        const queryParams = [];

        if (searchTerm) {
            query += ` WHERE LOWER(u.username) LIKE LOWER($1) OR af.transaction_id LIKE $2`;
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
        } else {
            query += ' WHERE 1=1'; //To handle where condition
        }

        query += ` ORDER BY af.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(pageSize, offset);

        const result = await client.query(query, queryParams);
        const totalCount = result.rows.length > 0 ? result.rows[0].total_count : 0; //Get total count from the result
        const addFundsHistory = result.rows.map(item => {
            delete item.total_count; //Remove unnecessary column
            return item;
        });
        res.json({ addFundsHistory, totalCount, currentPage: page, pageSize });
    } catch (error) {
        console.error('Error fetching add funds history:', error);
        res.status(500).json({ message: 'Failed to fetch add funds history.' });
    } finally {
        client.release();
    }
});

app.get('/fund-transfer-history', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10; // Number of transactions per page
        const offset = (page - 1) * pageSize;


        // Fetch transfer history, including sender and receiver details
        const query = `
            SELECT wt.transactionid, wt.transactiondate, wt.amount,
                   fs.username AS from_username, fs.user_id AS from_userid,
                   ts.username AS to_username, ts.user_id AS to_userid
            FROM wallettransactions wt
            JOIN users fs ON wt.fromid = fs.user_id
            JOIN users ts ON wt.toid = ts.user_id
            WHERE wt.transactiontype = 'FUND_TRANSFER'
              AND (wt.fromid = $1 OR wt.toid = $1)
            ORDER BY wt.transactiondate DESC 
            LIMIT $2 OFFSET $3
        `;

        const values = [userId, pageSize, offset];
        const { rows: transactions } = await client.query(query, values);


        const countQuery = `
            SELECT COUNT(*) AS total
            FROM wallettransactions
            WHERE transactiontype = 'FUND_TRANSFER'
            AND (fromid = $1 OR toid = $1)
        `;
        const countValues = [userId];
        const { rows: countResult } = await client.query(countQuery, countValues);

        // Check if countResult.rows is defined and has elements
        const totalCount = countResult && countResult.rows && countResult.rows.length > 0
            ? parseInt(countResult.rows[0].total, 10)
            : 0;


        res.json({
            transactions,
            pagination: { currentPage: page, pageSize, totalCount }
        });

    } catch (error) {
        console.error('Error fetching transaction history:', error);
        res.status(500).json({ message: 'Failed to fetch transaction history' });
    } finally {
        client.release();
    }
});

app.get('/pending-fund-requests', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const offset = (page - 1) * pageSize;

        const countQuery = `SELECT COUNT(*) AS total FROM add_funds WHERE status = 'pending'`;
        const countResult = await client.query(countQuery);
        const totalCount = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalCount / pageSize);

        const { rows } = await client.query(
            `SELECT id, user_id, amount, transaction_id, created_at, status
             FROM add_funds
             WHERE status = 'pending'
             LIMIT $1 OFFSET $2`,
            [pageSize, offset]
        );

        res.json({ requests: rows, pagination: { currentPage: page, pageSize, totalCount, totalPages } });
    } catch (error) {
        console.error('Error fetching pending fund requests:', error);
        res.status(500).json({ message: 'Failed to fetch pending fund requests.' });
    } finally {
        client.release();
    }
});

app.get('/approved-fund-requests', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const offset = (page - 1) * pageSize;

        //Add count query
        const countQuery = `SELECT COUNT(*) AS total FROM add_funds af JOIN users u ON af.user_id = u.user_id WHERE af.status = 'approved'`;
        const countResult = await client.query(countQuery);
        const totalCount = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalCount / pageSize);

        const { rows } = await client.query(
            `SELECT af.id, af.user_id, u.username, af.amount, af.transaction_id, af.created_at, af.status
             FROM add_funds af
             JOIN users u ON af.user_id = u.user_id
             WHERE af.status = 'approved'
             LIMIT $1 OFFSET $2`,
            [pageSize, offset]
        );

        res.json({ requests: rows, pagination: { currentPage: page, pageSize, totalCount, totalPages } }); // Send pagination data
    } catch (error) {
        console.error('Error fetching approved fund requests:', error);
        res.status(500).json({ message: 'Failed to fetch approved fund requests.' });
    } finally {
        client.release();
    }
});

app.get('/rejected-fund-requests', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const offset = (page - 1) * pageSize;

        //Add count query
        const countQuery = `SELECT COUNT(*) AS total FROM add_funds af JOIN users u ON af.user_id = u.user_id WHERE af.status = 'rejected'`;
        const countResult = await client.query(countQuery);
        const totalCount = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalCount / pageSize);


        const { rows } = await client.query(
            `SELECT af.id, af.user_id, u.username, af.amount, af.transaction_id, af.created_at, af.status
             FROM add_funds af
             JOIN users u ON af.user_id = u.user_id
             WHERE af.status = 'rejected'
             LIMIT $1 OFFSET $2`,
            [pageSize, offset]
        );

        res.json({ requests: rows, pagination: { currentPage: page, pageSize, totalCount, totalPages } }); // Send pagination data
    } catch (error) {
        console.error('Error fetching rejected fund requests:', error);
        res.status(500).json({ message: 'Failed to fetch rejected fund requests.' });
    } finally {
        client.release();
    }
});

app.post('/approve-fund-request/:requestId', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        // Check if the user is an admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized.' });
        }

        const requestId = req.params.requestId;

        const requestDetailsResult = await client.query('SELECT * FROM add_funds WHERE id = $1', [requestId]);

        if (requestDetailsResult.rows.length === 0) {
            return res.status(404).json({ message: 'Fund request not found.' });
        }

        const request = requestDetailsResult.rows[0];
        const userId = request.user_id;
        const amount = parseFloat(request.amount);

        // Start the transaction
        await client.query('BEGIN');

        try {
            // Update the fund request status to 'approved'
            const updateResult = await client.query(
                'UPDATE add_funds SET status = $1 WHERE id = $2',
                ['approved', requestId]
            );

            if (updateResult.rowCount !== 1) {
                throw new Error('Failed to update fund request status.');
            }

            // Update the user's balance
            const balanceUpdateResult = await client.query(
                'UPDATE users SET fund_income = fund_income + $1 WHERE user_id = $2',
                [amount, userId]
            );

            if (balanceUpdateResult.rowCount !== 1) {
                throw new Error('Failed to update user balance.');
            }

            // Record the wallet transaction (assuming `recordWalletTransaction` is defined elsewhere)
            await recordWalletTransaction(userId, amount, "FUND_APPROVAL");

            // Commit the transaction if both operations are successful
            await client.query('COMMIT');

            res.json({ message: 'Fund request approved successfully!' });
        } catch (error) {
            // Rollback the transaction if there's an error
            await client.query('ROLLBACK');
            console.error('Error approving fund request:', error);
            res.status(500).json({ message: 'Failed to approve fund request.' });
        }
    } catch (error) {
        console.error('Error approving fund request:', error);
        res.status(500).json({ message: 'Failed to approve fund request.' });
    } finally {
        // Release the client back to the pool
        client.release();
    }
});

async function getRootUserId(userID) {
    try {
        const [rootUsers] = await pool.query(`SELECT user_id FROM users WHERE user_id = '${userID}'`);
        console.log("Root User ID:", rootUsers[0].user_id);
        return rootUsers.length > 0 ? rootUsers[0].user_id : null;
    } catch (error) {
        console.error('Error fetching root user ID:', error);
        throw error;
    }
}

app.post('/reject-fund-request/:requestId', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized.' });
        }

        const requestId = req.params.requestId;

        const result = await client.query(
            'UPDATE add_funds SET status = $1 WHERE id = $2',
            ['rejected', requestId]
        );

        if (result.rowCount === 1) {
            res.json({ message: 'Fund request rejected.' });
        } else {
            res.status(404).json({ message: 'Fund request not found.' });
        }

    } catch (error) {
        console.error('Error rejecting fund request:', error);
        res.status(500).json({ message: 'Failed to reject fund request.' });
    } finally {
        // Release the client back to the pool
        client.release();
    }
});

async function findReferrals(userId, level) {
    const client = await pgPool.connect();
    try {
        const referrals = [];
        const query = `
            SELECT user_id FROM genealogy WHERE 
            level${level} = $1
        `;

        const { rows } = await client.query(query, [userId]);

        rows.forEach(row => {
            referrals.push(row.user_id);
        });

        return referrals;
    } catch (error) {
        console.error("Error fetching referrals:", error);
        throw error;
    } finally {
        client.release();
    }
}


function findNextFreeSlotAnywhere(genealogyTree, maxDepth = 5) {
    const queue = [genealogyTree]; // Start BFS traversal from the root

    while (queue.length > 0) {
        const currentNode = queue.shift(); // Get the next node in the queue

        // Check if this node has fewer than 6 children
        if (currentNode.children.length < 6) {
            return currentNode; // Found a free slot
        }

        // Enqueue the children to explore deeper levels
        for (const child of currentNode.children) {
            if (child.level <= maxDepth) {
                queue.push(child); // Continue to explore within the allowed levels
            }
        }
    }

    return null; // No free slot found within the max depth
}
// Helper functions to fetch username and email (replace with your actual logic)
async function getUserName(userId) {
    try {
        const [rows] = await pool.query('SELECT username FROM users WHERE user_id = ?', [userId]);
        return rows.length > 0 ? rows[0].username : 'Unknown User';
    } catch (error) {
        console.error('Error fetching username:', error);
        return 'Error fetching username';
    }
}

async function getUserEmail(userId) {
    try {
        const [rows] = await pool.query('SELECT email FROM users WHERE user_id = ?', [userId]);
        return rows.length > 0 ? rows[0].email : 'Unknown Email';
    } catch (error) {
        console.error('Error fetching email:', error);
        return 'Error fetching email';
    }
}

app.put('/update-personal', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        console.log(req.body);
        const updatedData = sanitizeAndValidateUserData(req.body);

        if (updatedData && updatedData.error) {
            return res.status(400).json({ message: updatedData.error });
        } else if (!updatedData) {  // Handle the case where sanitized data is null (no valid fields)
            return res.status(400).json({ message: 'No valid data to update.' }); // Or a more specific message.
        }

        // Check for Empty Update Data (after sanitization and validation)
        if (Object.keys(updatedData).length === 0) {
            return res.status(400).json({ message: 'No data to update.' });
        }

        const updateFields = [];
        const updateValues = [];
        for (const key in updatedData) {
            if (updatedData.hasOwnProperty(key)) {
                updateFields.push(`${key} = $${updateValues.length + 1}`);
                updateValues.push(updatedData[key]);
            }
        }

        updateValues.push(userId); // Add userId at the end
        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = $${updateValues.length}`;

        console.log("Generated SQL Query:", updateQuery);          // Log the actual SQL query
        console.log("Update Values:", updateValues);               // Log the values being used
        console.log("Sanitized and Validated Data:", updatedData); // Log the sanitized data

        const { rowCount } = await client.query(updateQuery, updateValues);
        console.log(rowCount);
        if (rowCount === 1) {
            const { rows } = await client.query('SELECT * FROM users WHERE user_id = $1', [userId]);
            const updatedUser = rows[0];

            // Remove the password before sending the response
            delete updatedUser.password; // Or any other sensitive data

            res.json({ message: 'Personal details updated successfully', user: updatedUser });
        } else {
            res.status(404).json({ message: 'User not found or no data updated.' });
        }
    } catch (error) {
        console.error('Error updating personal details:', error);
        res.status(500).json({ message: 'Failed to update personal details: ' + error.message });
    } finally {
        client.release();
    }
});

function sanitizeAndValidateUserData(data) {
    const sanitizedData = {};
    const allowedFields = ['username', 'email', 'mobile', 'address', 'street', 'city', 'state', 'country', 'zipcode', 'aadhaar', 'pan']; // List of allowed fields

    for (const field of allowedFields) {
        if (data.hasOwnProperty(field)) {
            let value = data[field];

            if (value === null || (typeof value === 'string' && value.trim() === "")) {
                sanitizedData[field] = null;
                continue; // Skip this field if it's effectively null/empty
            }

            // Validation (add/modify rules as needed)
            switch (field) {
                case 'username':
                    if (value.length < 3) return { error: 'Username must be at least 3 characters long.' };
                    break;
                case 'email':
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { error: 'Invalid email address.' };
                    break;
                case 'zipcode':
                    if (value.length !== 6 || isNaN(parseInt(value, 10))) return { error: `${field.charAt(0).toUpperCase() + field.slice(1)} must be a 6-digit number.` }; // More specific message
                    break;
                case 'aadhaar': // Example Aadhaar validation (12 digits)
                    if (value.length !== 12 || isNaN(parseInt(value, 10))) return { error: "Aadhaar must be a 12-digit number." };
                    break;
                case 'pan':     // Basic PAN validation (alphanumeric, specific format - you'll need a stronger regex)
                    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) return { error: "Invalid PAN number format." };
                    break;
            }
            if (field === 'email') {
                sanitizedData.email = value.trim().toLowerCase();
            } else if (field === 'mobile' || field === 'zipcode' || field === 'aadhaar') { // handle numbers correctly
                sanitizedData[field] = parseInt(value, 10);
            }
            else {
                sanitizedData[field] = value.toString().trim(); // Always trim string fields
            }
        }
    }
    if (Object.keys(sanitizedData).length === 0) { // Check if sanitizedData is empty after the loop.
        return { error: "No valid data to update." }
    }

    return sanitizedData; // Return the sanitized object if all validations pass
}

app.put('/changepassword', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const { newPassword, confirmPassword } = req.body;

        if (!newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Query to fetch the user's current password
        const { rows } = await client.query('SELECT password FROM users WHERE user_id = $1', [userId]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the new password is the same as the old one
        if (newPassword === user.password) {
            return res.status(401).json({ message: 'The new password is the same as the old password' });
        }

        // Update the user's password in the database
        await client.query('UPDATE users SET password = $1 WHERE user_id = $2', [newPassword, userId]);

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

app.put('/changeTransactionPassword', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const { newTransactionPassword, confirmTransactionPassword } = req.body;

        if (!newTransactionPassword || !confirmTransactionPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (newTransactionPassword !== confirmTransactionPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Query to fetch the user's transaction password
        const { rows } = await client.query('SELECT transaction_password FROM users WHERE user_id = $1', [userId]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.transaction_password) {
            // If the user doesn't have a transaction password, set it
            await client.query('UPDATE users SET transaction_password = $1 WHERE user_id = $2', [newTransactionPassword, userId]);
            return res.json({ message: 'Transaction password set successfully' });
        }

        // If the user already has a transaction password, check if it's the same
        if (user.transaction_password === newTransactionPassword) {
            return res.status(401).json({ message: 'The new transaction password is the same as the old transaction password' });
        }

        // Update the transaction password
        await client.query('UPDATE users SET transaction_password = $1 WHERE user_id = $2', [newTransactionPassword, userId]);

        res.json({ message: 'Transaction password changed successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

app.put('/admin/changepassword', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New passwords do not match' });
        }

        const { rows } = await client.query('SELECT password FROM users WHERE user_id = $1', [userId]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (currentPassword !== user.password) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        if (newPassword === user.password) {
            return res.status(400).json({ message: 'New password cannot be the same as the current password' });
        }

        await client.query('UPDATE users SET password = $1 WHERE user_id = $2', [newPassword, userId]);

        res.json({ message: 'Admin password changed successfully' });

    } catch (error) {
        console.error('Error changing admin password:', error);
        res.status(500).json({ message: 'Failed to change password' });
    } finally {
        client.release();
    }
});

app.post('/news', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const news_id = uuidv4(); // Generate a unique news_id

        // Use parameterized queries in PostgreSQL
        const result = await client.query(
            'INSERT INTO news (news_id, title, content) VALUES ($1, $2, $3) RETURNING *',
            [news_id, title, content]
        );

        // Check if a row was inserted by checking rowCount (or use the RETURNING clause to confirm)
        if (result.rowCount === 1) {
            res.status(201).json({ message: 'news added successfully', news_id: news_id });
        } else {
            res.status(500).json({ message: 'Failed to add news' });
        }
    } catch (err) {
        console.error("Error adding news:", err);
        res.status(500).json({ message: 'Failed to add news: ' + err.message });
    } finally {
        client.release();
    }
});

app.get('/user/news/:userId', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;


        // Fetch news items associated with the user ID using pagination
        const query = `
            SELECT * 
            FROM news 
            WHERE user_id = $1 
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3;
        `;
        const values = [userId, pageSize, offset];
        const { rows: newsItems } = await client.query(query, values);


        //Get the total count of news items for pagination metadata
        const countQuery = `SELECT COUNT(*) AS total FROM news WHERE user_id = $1`;
        const { rows: countResult } = await client.query(countQuery, [userId]);
        const totalCount = parseInt(countResult[0].total, 10);


        res.json({
            news: newsItems,
            pagination: { currentPage: page, pageSize, totalCount } // Add pagination information
        });

    } catch (error) {
        console.error('Error fetching user news:', error);
        res.status(500).json({ message: 'Failed to fetch user news.' });
    } finally {
        client.release();
    }
});

app.put('/news/:news_id', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const news_id = req.params.news_id;
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        // Use parameterized query in PostgreSQL
        const result = await client.query(
            'UPDATE news SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE news_id = $3',
            [title, content, news_id]
        );

        // Check if a row was updated by checking rowCount
        if (result.rowCount === 1) {
            res.json({ message: 'news updated successfully' });
        } else {
            res.status(404).json({ message: 'news not found' });
        }
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ message: 'Failed to update news: ' + error.message });
    } finally {
        client.release();
    }
});

app.get('/news', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page) || 1; // Get the requested page, default to 1
        const pageSize = parseInt(req.query.pageSize) || 10; // Number of items per page, default 10
        const offset = (page - 1) * pageSize; // Calculate the offset for the SQL query

        // Fetch the news items for the current page with pagination
        const result = await client.query(
            'SELECT * FROM news ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [pageSize, offset]
        );
        const newsItems = result.rows;

        // Get the total count of news items (for pagination metadata)
        const totalCountResult = await client.query('SELECT COUNT(*) AS total FROM news');
        const totalCount = totalCountResult.rows[0].total;

        res.json({
            news: newsItems,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });

    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ message: 'Failed to fetch news' });
    } finally {
        client.release();
    }
});

app.get('/news/:news_id', authenticateToken, authorizeAdmin, async (req, res) => { // Requires admin authentication
    const client = await pgPool.connect();
    try {
        const news_id = req.params.news_id;

        // Use parameterized query for PostgreSQL with $1
        const result = await client.query('SELECT * FROM news WHERE news_id = $1', [news_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'news not found' });
        }

        res.json(result.rows[0]); // Send the first news item

    } catch (error) {
        console.error('Error fetching news details:', error);
        res.status(500).json({ message: 'Failed to fetch news details' });
    } finally {
        client.release();
    }
});

app.delete('/news/:news_id', authenticateToken, authorizeAdmin, async (req, res) => { // Requires admin authentication
    const client = await pgPool.connect();
    try {
        const news_id = req.params.news_id;

        // Use parameterized query for PostgreSQL with $1
        const result = await client.query('DELETE FROM news WHERE news_id = $1', [news_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'news not found' });
        }

        res.json({ message: 'news item deleted successfully' });
    } catch (error) {
        console.error('Error deleting news item:', error);
        res.status(500).json({ message: 'Failed to delete news item' });
    } finally {
        client.release();
    }
});

app.post('/add-bank', async (req, res) => {
    const client = await pgPool.connect();
    try {
        const {
            account_holder_name,
            account_number,
            bank_name,
            bank_ifsc,
            bank_branch
        } = req.body;

        if (!account_holder_name || !account_number || !bank_name || !bank_ifsc || !bank_branch) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Generate UUID using PostgreSQL's uuid_generate_v4()
        const account_id = uuidv4(); // Or use PostgreSQL's uuid_generate_v4() if using pg's uuid extension

        // Execute PostgreSQL insert query
        const result = await client.query(
            'INSERT INTO banks (account_id, account_holder_name, account_number, bank_name, bank_ifsc, bank_branch) VALUES ($1, $2, $3, $4, $5, $6) RETURNING account_id',
            [account_id, account_holder_name, account_number, bank_name, bank_ifsc, bank_branch]
        );

        if (result.rowCount === 1) {
            res.status(201).json({ message: 'Bank account added successfully', bank_id: result.rows[0].account_id });
        } else {
            res.status(500).json({ message: 'Failed to add bank account' });
        }
    } catch (error) {
        console.error('Error adding bank:', error);

        // Handle duplicate key errors (account_number or bank_ifsc)
        if (error.code === '23505') {  // PostgreSQL error code for unique violation
            res.status(409).json({ message: 'Account number or bank IFSC code already exists.' });
        } else {
            res.status(500).json({ message: 'Failed to add bank account' });
        }
    } finally {
        client.release();
    }
});

app.put('/edit-bank/:account_id', async (req, res) => {
    const client = await pgPool.connect();
    try {
        const bankId = req.params.account_id;
        const {
            account_holder_name,
            account_number,
            bank_name,
            bank_ifsc,
            bank_branch
        } = req.body;

        if (!account_holder_name || !account_number || !bank_name || !bank_ifsc || !bank_branch) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if bank account exists
        const result = await client.query('SELECT 1 FROM banks WHERE account_id = $1', [bankId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Bank account not found' });
        }

        // Update the bank record
        const updateResult = await client.query(
            'UPDATE banks SET account_holder_name = $1, account_number = $2, bank_name = $3, bank_ifsc = $4, bank_branch = $5 WHERE account_id = $6',
            [account_holder_name, account_number, bank_name, bank_ifsc, bank_branch, bankId]
        );

        if (updateResult.rowCount === 1) {
            res.json({ message: 'Bank account updated successfully' });
        } else {
            res.status(500).json({ message: 'Failed to update bank account' });
        }
    } catch (error) {
        console.error('Error editing bank:', error);
        res.status(500).json({ message: 'Failed to update bank account' });
    } finally {
        client.release(); // Ensure the client is released after the query
    }
});

app.get('/banks', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.query.userId; // User ID for filtering banks
        const page = parseInt(req.query.page) || 1; // Current page (default: 1)
        const limit = parseInt(req.query.limit) || 10; // Items per page (default: 10)
        const searchTerm = req.query.search || ""; // Search term

        const offset = (page - 1) * limit; // Calculate offset for pagination

        // Base queries and query parameters
        let query = 'SELECT * FROM banks';
        let countQuery = 'SELECT COUNT(*) AS total FROM banks';
        const queryParams = [];
        const countParams = [];

        // Add filtering logic if `searchTerm` is provided
        if (searchTerm) {
            query += ` WHERE (account_holder_name ILIKE $1 OR account_number ILIKE $2 
                       OR bank_name ILIKE $3 OR bank_ifsc ILIKE $4 OR bank_branch ILIKE $5)`;
            countQuery += ` WHERE (account_holder_name ILIKE $1 OR account_number ILIKE $2 
                           OR bank_name ILIKE $3 OR bank_ifsc ILIKE $4 OR bank_branch ILIKE $5)`;
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
            countParams.push(...queryParams); // Use the same params for count query
        }

        // Add filtering for `userId` if provided
        if (userId) {
            if (searchTerm) {
                query += ' AND user_id = $6';
                countQuery += ' AND user_id = $6';
            } else {
                query += ' WHERE user_id = $1';
                countQuery += ' WHERE user_id = $1';
            }
            queryParams.push(userId);
            countParams.push(userId);
        }

        // Add pagination to the query
        query += ' LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
        queryParams.push(limit, offset);

        // Execute the queries
        const { rows: banks } = await client.query(query, queryParams);
        const { rows: countResult } = await client.query(countQuery, countParams);
        const totalBanks = parseInt(countResult[0]?.total, 10) || 0;
        const totalPages = Math.ceil(totalBanks / limit);

        // Send the response
        res.json({ banks, totalBanks, totalPages, currentPage: page });
    } catch (error) {
        console.error('Error fetching banks:', error);
        res.status(500).json({ message: 'Failed to fetch bank accounts' });
    } finally {
        client.release(); // Ensure the client is released
    }
});


//server-side (bank/account_id)

app.get('/bank/:account_id', async (req, res) => {
    const client = await pgPool.connect();
    try {
        const account_id = req.params.account_id;

        // Use $1 as the placeholder for the account_id in PostgreSQL
        const { rows } = await client.query('SELECT * FROM banks WHERE account_id = $1', [account_id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Bank not found' });
        }

        res.json(rows[0]); // Send the bank data as JSON
    } catch (error) {
        console.error('Error fetching bank:', error);
        res.status(500).json({ message: 'An error occurred while fetching the bank' });
    } finally {
        client.release(); // Ensure the client is released back to the pool
    }
});

// Add UPI
app.post('/add-upi', authenticateToken, authorizeAdmin, upload.single('upi_image'), async (req, res) => {
    const client = await pgPool.connect();
    try {
        const { upi_address } = req.body;
        const upi_image = req.file; // Get the file object from multer

        if (!upi_address) {
            return res.status(400).json({ error: 'UPI address is required' });
        }
        if (!upi_image) {
            return res.status(400).json({ error: 'UPI image is required' });
        }


        const imageUrl = path.join('uploads', upi_image.filename); // Path to uploaded image
        const upi_id = uuidv4();

        const result = await client.query(
            'INSERT INTO upis (upi_id, upi_address, image_name) VALUES ($1, $2, $3) RETURNING upi_id',
            [upi_id, upi_address, imageUrl] // Store the file path
        );

        if (result.rows.length === 1) {
            res.status(201).json({ message: 'UPI added successfully', upi_id: result.rows[0].upi_id });
        } else {
            res.status(500).json({ error: 'Failed to add UPI' });
        }
    } catch (error) {
        console.error('Error adding UPI:', error);
        res.status(500).json({ error: 'Failed to add UPI: ' + error.message });
    } finally {
        client.release();
    }
});

// Server-side (Express.js)
app.get('/upis', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.search || "";
        const offset = (page - 1) * limit;

        // Initialize base queries and values array
        let query = 'SELECT * FROM upis';
        let countQuery = 'SELECT COUNT(*) AS total FROM upis';
        const values = [];
        let valueIndex = 1; // Track parameter index for placeholders

        // Add search condition if searchTerm is provided
        if (searchTerm) {
            query += ` WHERE upi_address LIKE $${valueIndex}`;
            countQuery += ` WHERE upi_address LIKE $${valueIndex}`;
            values.push(`%${searchTerm}%`);
            valueIndex++;
        }

        // Add LIMIT and OFFSET to the query
        query += ` LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
        values.push(limit, offset);

        // Execute the query to fetch UPIs
        const result = await client.query(query, values);
        const upis = result.rows;

        // Execute the query to get the total count of UPIs
        const countValues = searchTerm ? values.slice(0, -2) : []; // Use only searchTerm values for count query
        const countResult = await client.query(countQuery, countValues);
        const totalUPIs = parseInt(countResult.rows[0]?.total, 10) || 0;
        const totalPages = Math.ceil(totalUPIs / limit);

        res.json({ upis, totalPages, currentPage: page }); // Include currentPage in the response
    } catch (error) {
        console.error('Error fetching UPIs:', error);
        res.status(500).json({ error: 'Failed to fetch UPIs' });
    } finally {
        client.release(); // Release the client back to the pool
    }
});

app.get('/upis/:upiId', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const upiId = req.params.upiId;

        // Execute the query with parameterized values
        const result = await client.query('SELECT * FROM upis WHERE upi_id = $1', [upiId]);

        // Check if the result contains a row
        if (result.rows.length === 1) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'UPI not found' });
        }
    } catch (error) {
        console.error('Error fetching UPI:', error);
        res.status(500).json({ error: 'Failed to fetch UPI' });
    } finally {
        client.release(); // Release the client back to the pool
    }
});

app.put('/edit-upi/:upi_id', authenticateToken, authorizeAdmin, upload.single('upi_image'), async (req, res) => {
    const client = await pgPool.connect();
    try {
        const upi_id = req.params.upi_id;
        const { upi_address } = req.body;
        const upi_image = req.file;

        let imageUrl = null;
        if (upi_image) {
            imageUrl = path.join('uploads', upi_image.filename); // File path
        }

        let sql = 'UPDATE upis SET upi_address = $1';
        const values = [upi_address];

        if (imageUrl) {
            sql += ', image_name = $2';
            values.push(imageUrl);
        }

        sql += ' WHERE upi_id = $' + (values.length + 1);
        values.push(upi_id);

        const result = await client.query(sql, values);

        if (result.rowCount === 1) {
            res.json({ message: 'UPI updated successfully' });
        } else {
            res.status(404).json({ error: 'UPI not found' });
        }
    } catch (error) {
        console.error('Error updating UPI:', error);
        res.status(500).json({ error: 'Failed to update UPI' });
    } finally {
        client.release();
    }
});

app.post('/add-alert', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const { user_id, alert_message } = req.body;

        // Perform validation (e.g., check if required fields are present)
        if (!alert_message || !user_id) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const alert_id = uuidv4();

        // Use PostgreSQL INSERT syntax with RETURNING to get the generated alert_id
        const sql = 'INSERT INTO user_alerts (alert_id, user_id, alert_message) VALUES ($1, $2, $3) RETURNING alert_id';
        const values = [alert_id, user_id, alert_message];

        // Execute the query
        const result = await client.query(sql, values);

        res.status(201).json({
            message: 'Alert added successfully',
            alert_id: result.rows[0].alert_id // Return the generated alert_id
        });

    } catch (error) {
        console.error("Error adding alert:", error);
        res.status(500).json({ error: 'Failed to add alert' });
    } finally {
        client.release(); // Release the client back to the pool
    }
});

app.get('/companies/:company_id', async (req, res) => {
    const client = await pgPool.connect();
    try {
        const companyId = req.params.company_id;
        console.log(companyId);

        // Query for company and associated bank details using PostgreSQL parameterization
        const sql = `
            SELECT 
                c.company_id, c.company_logo, c.company_name, c.gst_number, c.phone, c.mobile, c.website,
                c.street, c.city, c.state, c.pincode, c.address, 
                b.account_id, b.account_holder_name, b.account_number, b.bank_name, b.bank_ifsc, b.bank_branch
            FROM companies c
            JOIN banks b ON c.bank_account_id = b.account_id  
            WHERE c.company_det_id = $1;
        `;

        // Execute the query
        const result = await client.query(sql, [companyId]);

        // Release the client back to the pool
        client.release();

        if (result.rows.length === 1) {
            res.json(result.rows);  // Send the result as an array of objects
        } else {
            res.status(404).json({ error: "Company not found" }); // Appropriate error message
        }
    } catch (error) {
        console.error("Error fetching company details:", error);
        res.status(500).json({ error: "Failed to fetch company details." });
    }
});

app.put('/companies/:company_id', upload.single('company_logo'), async (req, res) => {
    try {
        const companyId = req.params.company_id;
        let companyLogoUrl = null;
        const {
            bank_id, company_logo, company_name, gst_number, phone, mobile, website, street, city, state, pincode, address,
            account_holder_name, account_number, bank_name, bank_ifsc, bank_branch
        } = req.body;

        const client = await pgPool.connect();
        await client.query('BEGIN');  // Start a transaction
        try {  // Nested try...catch block for the transaction
            // 1. Update or insert bank details
            let bankId;
            const result = await client.query('SELECT account_id FROM banks WHERE account_id = $1', [bank_id]);
            console.log("bankRows", result.rows);
            if (result.rows.length > 0) {
                bankId = result.rows[0].account_id;
                console.log(bank_id);
                await client.query(`
                  UPDATE banks 
                  SET account_holder_name = $1, account_number = $2, bank_name = $3, bank_ifsc = $4, bank_branch = $5
                  WHERE account_id = $6
              `, [account_holder_name, account_number, bank_name, bank_ifsc, bank_branch, bankId]);
                console.log("bank updated");
            } else {
                // Create new bank record
                const insertResult = await client.query(`
                  INSERT INTO banks (account_id, account_holder_name, account_number, bank_name, bank_ifsc, bank_branch)
                  VALUES ($1, $2, $3, $4, $5, $6)
              `, [uuidv4(), account_holder_name, account_number, bank_name, bank_ifsc, bank_branch]);
                bankId = insertResult.rows[0].account_id;
            }
            console.log(bankId);

            // Handle company logo upload
            if (req.file) {
                companyLogoUrl = `/uploads/${req.file.filename}`; // Save the file path
            } else {
                companyLogoUrl = null;
            }

            // Update company details
            await client.query(`
              UPDATE companies
              SET company_logo = $1, company_name = $2, gst_number = $3, phone = $4, mobile = $5, 
              website = $6, street = $7, city = $8, state = $9, pincode = $10, address = $11, bank_account_id = $12
              WHERE company_id = $13
          `, [companyLogoUrl, company_name, gst_number, phone, mobile, website, street, city, state, pincode, address, bankId, companyId]);

            await client.query('COMMIT'); // Commit the transaction
            res.json({ message: "Company and bank details updated successfully." });
        } catch (err) {  // Transaction error handling
            await client.query('ROLLBACK');  // Roll back on error
            console.error("Transaction error:", err);
            res.status(500).json({ error: "Failed to update company details." });
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("Error updating company details:", error);
        res.status(500).json({ error: "Failed to update company details." });
    }
});

app.delete('/delete-alert/:alert_id', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const alert_id = req.params.alert_id;

        // Check if the alert exists
        const checkQuery = 'SELECT * FROM user_alerts WHERE alert_id = $1';
        const checkResult = await client.query(checkQuery, [alert_id]);

        if (checkResult.rows.length === 0) { // Alert not found
            return res.status(404).json({ error: "Alert not found" });
        }

        // Delete the alert
        const sql = 'DELETE FROM user_alerts WHERE alert_id = $1'; // Correct: Use alert_id
        const values = [alert_id];

        const result = await client.query(sql, values);

        if (result.rowCount === 1) {
            res.json({ message: 'Alert deleted successfully' });
        } else {
            res.status(404).json({ error: 'Alert not found' });
        }
    } catch (error) {
        console.error("Error deleting alert:", error);
        res.status(500).json({ error: 'Failed to delete alert' });
    } finally {
        client.release();
    }
});

app.get('/alerts', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || ""; // For searching

        // Start building the SQL query
        let baseQuery = `
            SELECT ua.alert_id, ua.alert_message, ua.created_at, u.user_id, u.username  
            FROM user_alerts ua
            JOIN users u ON ua.user_id = u.user_id
        `;
        let searchQuery = "";
        let searchValues = []; // Separate search values for countQuery

        if (search) {
            searchQuery = `WHERE (u.username ILIKE $1 OR ua.alert_message ILIKE $2) `;
            searchValues.push(`%${search}%`, `%${search}%`);
        }

        const orderBy = "ORDER BY ua.created_at DESC ";
        const offset = (page - 1) * limit;
        const limitClause = `LIMIT $1 OFFSET $2`;
        const finalValues = [...searchValues, limit, offset]; // Combine search values with pagination values

        const finalQuery = baseQuery + searchQuery + orderBy + limitClause;
        const countQuery = `
            SELECT COUNT(*) AS total 
            FROM user_alerts ua 
            JOIN users u ON ua.user_id = u.user_id 
        ` + searchQuery;

        // Execute the count query
        const countResult = await client.query(countQuery, searchValues);
        const total = countResult.rows[0].total;

        // Execute the final query
        const alertsResult = await client.query(finalQuery, finalValues);

        const totalPages = Math.ceil(total / limit);

        res.json({
            alerts: alertsResult.rows, // Access the rows property for results
            totalPages: totalPages,
            currentPage: page,
            totalAlerts: total
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    } finally {
        client.release(); // Ensure the client is released back to the pool
    }
});


app.put('/packages/:package_id', authenticateToken, authorizeAdmin, upload.single('package_image'), async (req, res) => {
    const client = await pgPool.connect();
    try {
        const package_id = req.params.package_id;
        const {
            package_name,
            package_price,
            package_gst,
            level1,
            level2,
            level3,
            level4,
        } = req.body;

        let imageUrl = null;
        if (req.file) { // Check if a new image was uploaded
            imageUrl = `/uploads/${req.file.filename}`; // Save the relative file path
        }

        // Use parameterized query for security and to prevent SQL injection
        let query = `
            UPDATE packages 
            SET package_name = $1, package_price = $2, package_gst = $3, 
                level1 = $4, level2 = $5, level3 = $6, level4 = $7 updated_at = CURRENT_TIMESTAMP
        `;
        const values = [
            package_name, package_price, package_gst, level1, level2, level3,
            level4
        ];

        if (imageUrl) { // Only update the image if a new one is provided
            query += `, package_image = $8`;
            values.push(imageUrl);
        }
        query += ` WHERE package_id = $9`;
        values.push(package_id);

        // Execute the query
        const result = await client.query(query, values);

        if (result.rowCount === 1) {  // In PostgreSQL, use rowCount for the affected rows
            res.json({ message: 'Package updated successfully' });
        } else {
            res.status(404).json({ message: 'Package not found' });
        }
    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({ message: 'Failed to update package' });
    } finally {
        client.release(); // Release the client back to the pool
    }
});

app.get('/packages/:package_id', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const package_id = req.params.package_id;

        // Use parameterized query for security
        const result = await client.query('SELECT * FROM packages WHERE package_id = $1', [package_id]);

        if (result.rowCount === 1) {  // In PostgreSQL, use rowCount to check the number of rows returned
            res.json(result.rows[0]);  // Access the first row (if any)
        } else {
            res.status(404).json({ message: 'Package not found' });
        }
    } catch (error) {
        console.error('Error fetching package:', error);
        res.status(500).json({ message: 'Failed to fetch package' });
    } finally {
        client.release();  // Release the client back to the pool
    }
});

app.get('/packages', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || ''; // Search term

        let query = 'SELECT * FROM packages';
        const params = [];

        if (search) {
            query += ` WHERE package_name ILIKE $1`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const { rows: packages } = await client.query(query, params);
        const countQuery = `SELECT COUNT(*) AS total FROM packages ${search ? `WHERE package_name ILIKE $1` : ''}`;
        const countResult = await client.query(countQuery, search ? [params[0]] : []);
        const totalPackages = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalPackages / limit);

        res.json({ packages, pagination: { currentPage: page, pageSize: limit, totalPages, totalPackages } });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ message: 'Failed to fetch packages.' });
    } finally {
        client.release();
    }
});

app.get('/level_income_plans', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const offset = (page - 1) * limit;

        // Start building query strings
        let query = 'SELECT * FROM level_income_plan';
        let countQuery = 'SELECT COUNT(*) AS total FROM level_income_plan';
        let queryParams = [];
        let countQueryParams = [];

        // Add WHERE clause if search is provided
        if (search) {
            query += ` WHERE boardname LIKE $1`;
            countQuery += ` WHERE boardname LIKE $1`;
            queryParams.push(`%${search}%`);
            countQueryParams.push(`%${search}%`);
        }

        // Add pagination to query
        query += ` ORDER BY id DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        // Execute the queries
        const result = await client.query(query, queryParams);
        const countResult = await client.query(countQuery, countQueryParams);

        const totalPlans = parseInt(countResult.rows[0].total, 10); // Convert to number
        const totalPages = Math.ceil(totalPlans / limit);

        res.json({
            plans: result.rows,  // Return the fetched level income plans
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalPlans: totalPlans
            }
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        client.release(); // Ensure the client is released after the query
    }
});

app.post('/tickets', authenticateToken, upload.single('file'), async (req, res) => {
    const client = await pgPool.connect();
    try {
        const { subject, message } = req.body; // Assuming file is base64 encoded
        const userId = req.user.userId; // Get userId from authentication middleware

        // Input validation
        if (!subject || subject.trim() === '' || !message || message.trim() === '') {
            return res.status(400).json({ error: 'Subject and message are required.' });
        }

        const ticketId = uuidv4();
        let fileUrl = null;
        if (req.file) { // Check if a file was uploaded
            fileUrl = `/uploads/${req.file.filename}`; // Save the relative file path
        }

        const insertQuery = `
            INSERT INTO tickets (ticket_id, user_id, subject, message, file_url, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())`;
        const values = [ticketId, userId, subject, message, fileUrl];

        await client.query(insertQuery, values); //Execute query

        res.status(201).json({ message: 'Ticket created successfully.', ticketId });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Failed to create ticket.' });
    } finally {
        client.release();
    }
});

app.get('/my-tickets', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const searchTerm = req.query.search || "";
        const offset = (page - 1) * pageSize;

        //Query for open tickets for the user
        let query = `
            SELECT 
                COUNT(*) OVER () AS total_count,  --Add total count for pagination
                t.*  
            FROM tickets t 
            WHERE t.user_id = $1 AND t.status IS NULL  -- Only open (pending) tickets for the user
        `;

        const values = [userId];
        if (searchTerm) {
            query += ` AND (LOWER(t.subject) LIKE LOWER($2) OR LOWER(t.message) LIKE LOWER($2))`; //Case-insensitive search
            values.push(`%${searchTerm}%`);
        }

        query += ` ORDER BY t.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(pageSize, offset);

        const { rows: tickets } = await client.query(query, values);
        const totalCount = tickets.length > 0 ? tickets[0].total_count : 0;
        const paginatedTickets = tickets.map(t => { delete t.total_count; return t; });

        res.json({ tickets: paginatedTickets, totalCount, currentPage: page, pageSize });

    } catch (error) {
        console.error("Error fetching user tickets:", error);
        res.status(500).json({ message: "Failed to fetch user tickets" });
    } finally {
        client.release();
    }
});

app.get('/tickets', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search ? req.query.search.trim() : ""; // Handle empty search
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM tickets WHERE status IS NULL'; // Base query
        let countQuery = 'SELECT COUNT(*) AS total FROM tickets WHERE status IS NULL'; // Count query
        const queryParams = [];
        const countParams = [];

        // Add search conditions dynamically
        if (search) {
            query += ` AND (subject ILIKE $1 OR message ILIKE $2)`;
            countQuery += ` AND (subject ILIKE $1 OR message ILIKE $2)`;
            queryParams.push(`%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`);
        }

        // Add pagination parameters
        query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        // Execute queries
        const result = await client.query(query, queryParams);
        const countResult = await client.query(countQuery, countParams);

        const totalTickets = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalTickets / limit);

        // Send response
        res.json({
            tickets: result.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalTickets: totalTickets
            }
        });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        client.release();
    }
});

// PUT /tickets/:ticketId/approve (Approve a ticket)
app.put('/tickets/:ticketId/approve', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const ticketId = req.params.ticketId;

        const result = await client.query(
            'UPDATE tickets SET status = $1 WHERE ticket_id = $2',
            ['Approved', ticketId] // Use parameterized query
        );

        if (result.rowCount === 0) { // rowCount for PostgreSQL instead of affectedRows
            return res.status(404).json({ message: "Ticket not found or already closed" });
        }

        res.json({ message: "Ticket approved successfully" });

    } catch (error) {
        console.error("Error approving ticket:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        client.release(); // Ensure the client is released after the query
    }
});





// PUT /tickets/:ticketId/reject (Reject a ticket)
app.put('/tickets/:ticketId/reject', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const ticketId = req.params.ticketId;

        // Use parameterized query for PostgreSQL
        const result = await client.query(
            'UPDATE tickets SET status = $1 WHERE ticket_id = $2',
            ['Rejected', ticketId] // Parameters for the query
        );

        if (result.rowCount === 0) { // In PostgreSQL, use rowCount to check affected rows
            return res.status(404).json({ message: "Ticket not found or already closed" });
        }

        res.json({ message: "Ticket rejected successfully" });

    } catch (error) {
        console.error("Error rejecting ticket:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        client.release(); // Ensure client is released
    }
});


app.get('/closed-tickets', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search ? req.query.search.trim() : ""; // Trim and handle empty search
        const statusFilter = req.query.status || ""; // Add status filter parameter
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM tickets WHERE 1=1'; // Base query
        let countQuery = 'SELECT COUNT(*) AS total FROM tickets WHERE 1=1'; // Count query
        const queryParams = [];
        const countParams = [];

        // Apply status filter
        if (statusFilter) {
            if (statusFilter === 'Open') {
                query += ' AND status IS NULL';
                countQuery += ' AND status IS NULL';
            } else if (statusFilter === 'Closed') {
                query += ' AND status IS NOT NULL';
                countQuery += ' AND status IS NOT NULL';
            }
        }

        // Apply search filter
        if (search) {
            query += ` AND (subject ILIKE $${queryParams.length + 1} OR message ILIKE $${queryParams.length + 2})`;
            countQuery += ` AND (subject ILIKE $${countParams.length + 1} OR message ILIKE $${countParams.length + 2})`;
            queryParams.push(`%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`);
        }

        // Add pagination
        query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        // Execute queries
        const result = await client.query(query, queryParams);
        const countResult = await client.query(countQuery, countParams);

        const totalClosedTickets = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.ceil(totalClosedTickets / limit);

        // Send response
        res.json({
            tickets: result.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalTickets: totalClosedTickets
            }
        });

    } catch (error) {
        console.error("Error fetching closed tickets:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        client.release(); // Ensure the client is released
    }
});


// Example UPDATE route (put your specific logic here):
app.put('/level_income_plans/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const planId = req.params.id;
        const { boardname, level1, level2, level3, level4, level5, first_earning, upgrade } = req.body; // Get updated data

        console.log(boardname, level1, level2, level3, level4, level5, first_earning, upgrade)

        // Input Validation (Important!)
        if (!boardname || !level1 || !level2 || !level3 || !level4 || !level5 || !first_earning || !upgrade) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const updateQuery = `
            UPDATE level_income_plan
            SET boardname = $1, level1 = $2, level2 = $3, level3 = $4, level4 = $5, level5 = $6, first_earning = $7, upgrade = $8
            WHERE id = $9
        `;
        const updateParams = [boardname, level1, level2, level3, level4, level5, first_earning, upgrade, planId];

        const result = await client.query(updateQuery, updateParams);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Level income plan not found" });
        }

        res.json({ message: "Level income plan updated successfully" });

    } catch (error) {
        console.error("Error updating level income plan:", error);
        res.status(500).json({ message: "Internal Server Error" });
    } finally {
        client.release(); // Ensure the client is released
    }
});


app.get('/logout', authenticateToken, (req, res) => {
    delete req.session.token;
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Logout failed' });
        }

        res.json({ message: 'Logout successful' });
    });
});

app.post('/claim-rebirth-bonus/:rebirthId', authenticateToken, async (req, res) => {
    const rebirthId = req.params.rebirthId;
    const userId = req.user.userId;

    const client = await pgPool.connect();
    await client.query('BEGIN');

    try {
        // 1. Verify rebirth ID belongs to the user and check conditions
        const { rows: rebirthData } = await client.query(`
            SELECT r.rebirth_date
            FROM rebirths r
            WHERE r.user_id = $1 AND r.rebirth_id = $2
        `, [userId, rebirthId]);

        if (rebirthData.length === 0) {
            return res.status(400).json({ message: "Invalid rebirth ID or not associated with your account." });
        }

        const rebirthDate = new Date(rebirthData[0].rebirth_date);
        const fifteenDaysAfterRebirth = new Date(rebirthDate);
        fifteenDaysAfterRebirth.setDate(rebirthDate.getDate() + 15);

        // Check conditions: 42 members under rebirthId, 6 direct referrals for the user, and 15-day limit
        if (!(await checkFullReferrals(rebirthId))) {
            return res.status(400).json({ message: "Rebirth ID does not have 42 downline members to claim." });
        }

        if (!(await checkSixDirectReferrals(userId))) {
            return res.status(400).json({ message: "You must have at least 6 direct referrals to claim the bonus." });
        }

        if (new Date() > fifteenDaysAfterRebirth) {
            return res.status(400).json({ message: "Bonus claim period (15 days) has expired for this rebirth ID." });
        }

        // 2. Credit the bonus (Example - Update total_balance or a specific income column)
        await client.query(
            "UPDATE users SET total_balance = total_balance + 100000 WHERE user_id = $1",
            [userId]
        );

        // 3. Record the transaction
        await recordWalletTransaction(userId, 100000, 'REBIRTH_BONUS', null);

        await client.query(
            'UPDATE rebirths SET status = $1 WHERE rebirth_id = $2',
            ['claimed', rebirthId]
        );

        await client.query('COMMIT');
        res.json({ message: "Rebirth bonus claimed successfully!" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error claiming rebirth bonus:", error);
        res.status(500).json({ message: "Failed to claim bonus." }); // More specific error message
    } finally {
        client.release();
    }
});


// New Route to get the time left
app.get('/rebirth-bonus-status', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;

        const { rows: rebirthData } = await client.query(
            'SELECT expiry_date FROM rebirths WHERE user_id = $1 AND status IS NULL', // Use $1 for parameterized query
            [userId]
        );

        if (rebirthData.length > 0) {
            const expiryDate = moment(rebirthData[0].expiry_date);
            const now = moment();
            const timeLeft = expiryDate.diff(now, 'days'); // Get the difference in days

            res.json({ daysLeft: timeLeft, status: timeLeft > 0 ? 'active' : 'expired' });
        } else {
            res.json({ daysLeft: 0, status: 'no_rebirth' });
        }
    } catch (error) {
        console.error('Error getting rebirth bonus status:', error);
        res.status(500).json({ message: 'Failed to get rebirth bonus status.' });
    } finally {
        client.release(); // Ensure the client is released
    }
});

app.get('/user-logs', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        // Safely parse query parameters with default values
        const draw = req.query.draw ? parseInt(req.query.draw, 10) : 1;
        const start = req.query.start ? parseInt(req.query.start, 10) : 0;
        const length = req.query.length ? parseInt(req.query.length, 10) : 10;
        const search = req.query.search?.value || "";

        // Base queries
        let query = `SELECT username as member, ip_address, browser, 
            TO_CHAR(logged_at, 'YYYY/MM/DD HH24:MI:SS') AS date 
            FROM user_logs`;
        let countQuery = `SELECT COUNT(*) AS count FROM user_logs`;

        // Parameters
        const queryParams = [];
        const countParams = [];

        // Handle search filtering
        if (search && search.trim() !== "") {
            const whereClause = ` WHERE username ILIKE $1 OR ip_address ILIKE $1 OR browser ILIKE $1`;
            query += whereClause;
            countQuery += whereClause;

            queryParams.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        // Add ordering, limit, and offset for the main query
        const paramIndex = queryParams.length + 1;
        query += ` ORDER BY logged_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(length, start);

        // Execute the queries
        const { rows: logs } = await client.query(query, queryParams);
        const { rows: [countResult] } = await client.query(countQuery, countParams);

        const recordsTotal = parseInt(countResult.count, 10);
        const recordsFiltered = search ? recordsTotal : recordsTotal;

        // Respond with the data
        res.json({
            draw,
            recordsTotal,
            recordsFiltered,
            data: logs,
        });
    } catch (error) {
        console.error('Error fetching user logs:', error);
        res.status(500).json({ message: 'Failed to fetch user logs.' });
    } finally {
        client.release();
    }
});
async function processRebirthBonuses() {
    const client = await pgPool.connect();;
    try {
        await client.query('BEGIN'); // Start transaction

        const { rows: expiredRebirths } = await client.query(
            'SELECT * FROM rebirths WHERE expiry_date < CURRENT_TIMESTAMP AND status IS NULL FOR UPDATE' // Lock rows
        );

        for (const rebirth of expiredRebirths) {
            const userId = rebirth.user_id;
            const rebirthId = rebirth.rebirth_id;

            try {
                const hasSixReferrals = await checkSixDirectReferrals(userId, client); // Ensure the `client` is passed to the helper function
                if (!hasSixReferrals) {  // Handle referrals
                    await client.query(
                        'UPDATE rebirths SET status = $1 WHERE rebirth_id = $2',
                        ['insufficient_referrals', rebirthId]
                    );

                    sendInsufficientReferralsEmail(userId, rebirthId);

                    continue; // Skip to the next rebirth
                }

                const has42Members = await checkFullReferrals(rebirthId);

                if (has42Members) {
                    await creditRebirthBonus(userId, client);
                    await client.query(
                        'UPDATE rebirths SET status = $1, claimed_date = CURRENT_TIMESTAMP WHERE rebirth_id = $2',
                        ['claimed', rebirthId]
                    );
                } else {
                    await redistributeBonus(userId, rebirthId, client);
                }
            } catch (err) {
                console.error(`Error processing rebirth bonus for rebirthId ${rebirthId}:`, err);
            }
        }

        await client.query('COMMIT'); // Commit transaction
    } catch (error) {
        if (client) await client.query('ROLLBACK'); // Rollback transaction in case of error
        console.error('Error in scheduled task:', error);
    } finally {
        if (client) client.release(); // Release client connection
    }
}

app.get('/my-team', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();

    try {
        const userId = req.user.userId;

        const team = {};

        for (let level = 1; level <= 4; level++) {
            // Fetch referrals for the current level
            const referrals = await getReferralsAtLevel(userId, level, client);

            const levelData = {
                active: 0,
                inactive: 0
            };

            if (referrals.length > 0) {
                // Query for statuses of all users in the current level
                const referralIds = referrals.map(r => `'${r}'`).join(',');

                const { rows } = await client.query(`
                    SELECT user_id, status
                    FROM users
                    WHERE user_id IN (${referralIds})
                `);

                // Count active and inactive users based on status
                rows.forEach(({ status }) => {
                    if (status === 'Active') {
                        levelData.active++;
                    } else {
                        levelData.inactive++;
                    }
                });
            }

            // Save the count of active and inactive users for the current level
            team[`level${level}`] = levelData;
        }

        res.json({ team });

    } catch (error) {
        console.error('Error fetching team data:', error);
        res.status(500).json({ message: 'Failed to fetch team data' });
    } finally {
        client.release();
    }
});

// Updated getReferralsAtLevel Function
async function getReferralsAtLevel(userId, level, client) {
    if (level === 1) {
        // Direct referrals (Level 1: member1, member2, ..., member6)
        const { rows } = await client.query(`
            SELECT member1, member2, member3, member4
            FROM genealogy
            WHERE user_id = $1
        `, [userId]);

        if (!rows[0]) return [];
        // Return all non-null member values as referrals for level 1
        return Object.values(rows[0]).filter(val => val !== null);
    } else {
        // For levels > 1, we need to get referrals recursively
        // First, fetch referrals from the previous level
        const previousLevelReferrals = await getReferralsAtLevel(userId, level - 1, client);

        if (previousLevelReferrals.length === 0) return [];

        const referralIds = previousLevelReferrals.map(r => `'${r}'`).join(',');

        // Query to get members (member1, member2, ..., member6) of previous level referrals
        const { rows } = await client.query(`
            SELECT member1, member2, member3, member4
            FROM genealogy
            WHERE user_id IN (${referralIds})
        `);

        // Gather all non-null member values from the current level (level N)
        return rows.flatMap(row => Object.values(row).filter(val => val !== null));
    }
}

app.get('/my-team/:level', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const requestedLevel = parseInt(req.params.level, 10);
        const page = parseInt(req.query.page, 10) || 1;  // Get current page from query params
        const pageSize = parseInt(req.query.pageSize, 10) || 10; // Rows per page
        const searchTerm = req.query.search || ""; // For searching
        const offset = (page - 1) * pageSize;

        if (isNaN(requestedLevel) || requestedLevel < 1 || requestedLevel > 5) {
            return res.status(400).json({ message: "Invalid level" });
        }


        const referrals = await getReferralsAtLevel(userId, requestedLevel, client);

        // Fetch user details for the current page with search applied
        const usersQuery = `
            SELECT u.user_id, u.username, u.status, u.created_at,
                s.username AS sponsor_username, s.user_id AS sponsor_id  
            FROM users u
            LEFT JOIN users s ON u.introducer_id = s.user_id  
            WHERE u.user_id = ANY($1)
            AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
            ORDER BY u.id ASC  -- Order by user_id in ascending order
            LIMIT $4 OFFSET $5
        `;

        const usersValues = [referrals, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const { rows: teamMembers } = await client.query(usersQuery, usersValues);

        // Count total matching users (including search)
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM users
            WHERE user_id = ANY($1)
            AND (LOWER(username) LIKE LOWER($2) OR LOWER(user_id) LIKE LOWER($3))
        `;

        const countValues = [referrals, `%${searchTerm}%`, `%${searchTerm}%`];
        const countResult = await client.query(countQuery, countValues);
        const totalCount = parseInt(countResult.rows[0].total, 10);

        res.json({
            teamMembers,
            pagination: { currentPage: page, pageSize, totalCount } // Include pagination info
        });

    } catch (error) {
        console.error('Error fetching team data:', error);
        res.status(500).json({ message: 'Failed to fetch team data' });
    } finally {
        client.release();
    }
});

app.get('/silver-board-downline/:level', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const requestedLevel = parseInt(req.params.level, 10); // Level from URL parameter
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || "";
        const offset = (page - 1) * pageSize;

        if (isNaN(requestedLevel) || requestedLevel < 1 || requestedLevel > 5) {
            return res.status(400).json({ message: "Invalid level" });
        }

        // 1. Check if user is on Silver Board or higher
        if (!(await isUserOnSilverOrHigherBoard(userId))) {
            return res.status(403).json({ message: "You are not on the Silver Board or higher." });
        }

        // 2. Get referrals for the requested level (using Silver Board genealogy)
        const referrals = await getSilverBoardReferralsAtLevel(userId, requestedLevel, client);

        if (referrals.length === 0) {
            return res.json({  // Return empty result with pagination info
                teamMembers: [],
                pagination: { currentPage: page, pageSize, totalCount: 0 }
            });
        }


        // Fetch user details for the current page with search applied
        const usersQuery = `
            SELECT u.user_id, u.username, u.status, u.created_at,
                   s.username AS sponsor_username, s.user_id AS sponsor_id, b.earnings AS board_earnings   
            FROM users u
            LEFT JOIN users s ON u.introducer_id = s.user_id 
            LEFT JOIN boards b ON u.user_id = b.userid AND b.boardtype = 'SILVER' -- Join for board earnings
            WHERE u.user_id = ANY($1)
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
            ORDER BY u.created_at DESC
            LIMIT $4 OFFSET $5
        `;
        const usersValues = [referrals, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const { rows: teamMembers } = await client.query(usersQuery, usersValues);

        // Count total matching users (including search)
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM users u
            WHERE u.user_id = ANY($1)
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
        `;
        const countValues = [referrals, `%${searchTerm}%`, `%${searchTerm}%`];
        const countResult = await client.query(countQuery, countValues);
        const totalCount = parseInt(countResult.rows[0].total, 10);

        res.json({
            teamMembers,
            pagination: { currentPage: page, pageSize, totalCount }
        });

    } catch (error) {
        console.error(`Error fetching Silver Board downline for level ${requestedLevel}:`, error);
        res.status(500).json({ message: 'Failed to fetch downline data' });
    } finally {
        client.release();
    }
});

app.get('/gold-board-downline/:level', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        // ... (same structure as silver-board-downline, but use getGoldBoardReferralsAtLevel and 'GOLD' board type)
        // ... (same structure as silver-board-downline) ...
        const userId = req.user.userId;
        const requestedLevel = parseInt(req.params.level, 10); // Level from URL parameter
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || "";
        const offset = (page - 1) * pageSize;

        if (isNaN(requestedLevel) || requestedLevel < 1 || requestedLevel > 5) {
            return res.status(400).json({ message: "Invalid level" });
        }

        if (!(await isUserOnBoard(userId, 'GOLD'))) { // Check if user is on Gold Board
            return res.status(403).json({ message: "You are not on the Gold Board." });
        }



        const referrals = await getGoldBoardReferralsAtLevel(userId, requestedLevel, client);


        if (referrals.length === 0) {
            return res.json({
                teamMembers: [],
                pagination: { currentPage: page, pageSize, totalCount: 0 }
            });
        }

        // Fetch user details with board earnings (similar to Silver Board)
        const usersQuery = `  
            SELECT u.user_id, u.username, u.status, u.created_at,
                   s.username AS sponsor_username, s.user_id AS sponsor_id, b.earnings AS board_earnings   
            FROM users u
            LEFT JOIN users s ON u.introducer_id = s.user_id 
            LEFT JOIN boards b ON u.user_id = b.userid AND b.boardtype = 'GOLD' -- Join for board earnings
            WHERE u.user_id = ANY($1)
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
            ORDER BY u.created_at DESC
            LIMIT $4 OFFSET $5
        `;
        const usersValues = [referrals, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const { rows: teamMembers } = await client.query(usersQuery, usersValues);

        // Count total matching users (including search) - similar to Silver Board
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM users u
            WHERE u.user_id = ANY($1)
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
        `;
        const countValues = [referrals, `%${searchTerm}%`, `%${searchTerm}%`];
        const countResult = await client.query(countQuery, countValues);
        const totalCount = parseInt(countResult.rows[0].total, 10);


        res.json({
            teamMembers,
            pagination: { currentPage: page, pageSize, totalCount }
        });


    } catch (error) {
        console.error(`Error fetching Gold Board downline for level ${requestedLevel}:`, error);
        res.status(500).json({ message: 'Failed to fetch downline data' });
    } finally {
        client.release();
    }
});

app.get('/diamond-board-downline/:level', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        // ... (same structure as silver-board-downline, but use getGoldBoardReferralsAtLevel and 'GOLD' board type)
        // ... (same structure as silver-board-downline) ...
        const userId = req.user.userId;
        const requestedLevel = parseInt(req.params.level, 10); // Level from URL parameter
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || "";
        const offset = (page - 1) * pageSize;

        if (isNaN(requestedLevel) || requestedLevel < 1 || requestedLevel > 5) {
            return res.status(400).json({ message: "Invalid level" });
        }

        if (!(await isUserOnBoard(userId, 'DIAMOND'))) { // Check if user is on Gold Board
            return res.status(403).json({ message: "You are not on the Diamond Board." });
        }



        const referrals = await getdiamondBoardReferralsAtLevel(userId, requestedLevel, client);


        if (referrals.length === 0) {
            return res.json({
                teamMembers: [],
                pagination: { currentPage: page, pageSize, totalCount: 0 }
            });
        }

        // Fetch user details with board earnings (similar to Silver Board)
        const usersQuery = `  
            SELECT u.user_id, u.username, u.status, u.created_at,
                   s.username AS sponsor_username, s.user_id AS sponsor_id, b.earnings AS board_earnings   
            FROM users u
            LEFT JOIN users s ON u.introducer_id = s.user_id 
            LEFT JOIN boards b ON u.user_id = b.userid AND b.boardtype = 'DIAMOND' -- Join for board earnings
            WHERE u.user_id = ANY($1)
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
            ORDER BY u.created_at DESC
            LIMIT $4 OFFSET $5
        `;
        const usersValues = [referrals, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const { rows: teamMembers } = await client.query(usersQuery, usersValues);

        // Count total matching users (including search) - similar to Silver Board
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM users u
            WHERE u.user_id = ANY($1)
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
        `;
        const countValues = [referrals, `%${searchTerm}%`, `%${searchTerm}%`];
        const countResult = await client.query(countQuery, countValues);
        const totalCount = parseInt(countResult.rows[0].total, 10);


        res.json({
            teamMembers,
            pagination: { currentPage: page, pageSize, totalCount }
        });


    } catch (error) {
        console.error(`Error fetching Diamond Board downline for level ${requestedLevel}:`, error);
        res.status(500).json({ message: 'Failed to fetch downline data' });
    } finally {
        client.release();
    }
});

app.get('/platinum-board-downline/:level', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const requestedLevel = parseInt(req.params.level, 10); // Level from URL parameter
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || "";
        const offset = (page - 1) * pageSize;

        if (isNaN(requestedLevel) || requestedLevel < 1 || requestedLevel > 5) {
            return res.status(400).json({ message: "Invalid level" });
        }

        if (!(await isUserOnBoard(userId, 'PLATINUM'))) {
            return res.status(403).json({ message: "You are not on the Platinum Board." });
        }



        const referrals = await getplatinumBoardReferralsAtLevel(userId, requestedLevel, client);


        if (referrals.length === 0) {
            return res.json({
                teamMembers: [],
                pagination: { currentPage: page, pageSize, totalCount: 0 }
            });
        }

        const usersQuery = `  
            SELECT u.user_id, u.username, u.status, u.created_at,
                   s.username AS sponsor_username, s.user_id AS sponsor_id, b.earnings AS board_earnings   
            FROM users u
            LEFT JOIN users s ON u.introducer_id = s.user_id 
            LEFT JOIN boards b ON u.user_id = b.userid AND b.boardtype = 'PLATINUM' -- Join for board earnings
            WHERE u.user_id = ANY($1)
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
            ORDER BY u.created_at DESC
            LIMIT $4 OFFSET $5
        `;
        const usersValues = [referrals, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const { rows: teamMembers } = await client.query(usersQuery, usersValues);

        // Count total matching users (including search) - similar to Silver Board
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM users u
            WHERE u.user_id = ANY($1)
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
        `;
        const countValues = [referrals, `%${searchTerm}%`, `%${searchTerm}%`];
        const countResult = await client.query(countQuery, countValues);
        const totalCount = parseInt(countResult.rows[0].total, 10);


        res.json({
            teamMembers,
            pagination: { currentPage: page, pageSize, totalCount }
        });


    } catch (error) {
        console.error(`Error fetching Platinum Board downline for level ${requestedLevel}:`, error);
        res.status(500).json({ message: 'Failed to fetch downline data' });
    } finally {
        client.release();
    }
});

app.get('/king-board-downline/:level', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const requestedLevel = parseInt(req.params.level, 10); // Level from URL parameter
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || "";
        const offset = (page - 1) * pageSize;

        if (isNaN(requestedLevel) || requestedLevel < 1 || requestedLevel > 5) {
            return res.status(400).json({ message: "Invalid level" });
        }

        if (!(await isUserOnBoard(userId, 'KING'))) {
            return res.status(403).json({ message: "You are not on the King Board." });
        }



        const referrals = await getkingBoardReferralsAtLevel(userId, requestedLevel, client);


        if (referrals.length === 0) {
            return res.json({
                teamMembers: [],
                pagination: { currentPage: page, pageSize, totalCount: 0 }
            });
        }

        const usersQuery = `  
            SELECT u.user_id, u.username, u.status, u.created_at,
                   s.username AS sponsor_username, s.user_id AS sponsor_id, b.earnings AS board_earnings   
            FROM users u
            LEFT JOIN users s ON u.introducer_id = s.user_id 
            LEFT JOIN boards b ON u.user_id = b.userid AND b.boardtype = 'KING' -- Join for board earnings
            WHERE u.user_id = ANY($1)
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
            ORDER BY u.created_at DESC
            LIMIT $4 OFFSET $5
        `;
        const usersValues = [referrals, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const { rows: teamMembers } = await client.query(usersQuery, usersValues);

        // Count total matching users (including search) - similar to Silver Board
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM users u
            WHERE u.user_id = ANY($1)
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
        `;
        const countValues = [referrals, `%${searchTerm}%`, `%${searchTerm}%`];
        const countResult = await client.query(countQuery, countValues);
        const totalCount = parseInt(countResult.rows[0].total, 10);


        res.json({
            teamMembers,
            pagination: { currentPage: page, pageSize, totalCount }
        });


    } catch (error) {
        console.error(`Error fetching King Board downline for level ${requestedLevel}:`, error);
        res.status(500).json({ message: 'Failed to fetch downline data' });
    } finally {
        client.release();
    }
});

app.get('/sponsor-income-details', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        //Improved SQL query joining necessary tables
        const sponsorIncomeDetailsQuery = `
            SELECT 
                wt.transactionid,
                wt.transactiondate AS transaction_date, 
                wt.amount, 
                u.username AS member_username, 
                u.user_id AS member_id, 
                ru.username AS member_child_username, 
                ru.user_id AS member_child_id,
                tu.package AS package,
                (SELECT p.package_price FROM packages p WHERE p.package_name = tu.package) AS package_price,
                wt.transactiontype AS transaction_type
            FROM wallettransactions wt
            JOIN users u ON wt.fromid = u.user_id
            LEFT JOIN users ru ON wt.toid = ru.user_id
            LEFT JOIN user_topup tu ON u.user_id = tu.user_id -- Join with user_topup
            LEFT JOIN packages p ON p.package_name = tu.package -- Join with packages
            WHERE wt.transactiontype = 'DIRECT_REFERRAL'
            AND wt.fromid = $1
            AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
            ORDER BY wt.transactiondate DESC
            LIMIT $4 OFFSET $5;
        `;


        const values = [userId, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const { rows: sponsorIncomeDetails } = await client.query(sponsorIncomeDetailsQuery, values);


        //Improved total count query
        const totalCountQuery = `
            SELECT COUNT(*) AS total
            FROM wallettransactions wt
            JOIN users u ON wt.fromid = u.user_id
            LEFT JOIN users ru ON wt.toid = ru.user_id
            LEFT JOIN user_topup tu ON u.user_id = tu.user_id  -- Join with user_topup
            LEFT JOIN packages p ON p.package_name = tu.package -- Join with packages (assuming package_name in user_topup)
            WHERE wt.transactiontype = 'DIRECT_REFERRAL'
            AND wt.fromid = $1
            AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3));
        `;

        const totalCountValues = [userId, `%${searchTerm}%`, `%${searchTerm}%`];
        const { rows: totalCountResult } = await client.query(totalCountQuery, totalCountValues);
        const totalCount = parseInt(totalCountResult[0].total, 10);

        res.json({
            sponsorIncomeDetails,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching sponsor income details:', error);
        res.status(500).json({ message: 'Failed to fetch sponsor income details.' });
    } finally {
        client.release();
    }
});

app.get('/level-income', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;


        const levelIncomeData = await calculateLevelIncome(userId, client); // Call new function
        const totalCount = levelIncomeData.length;
        const paginatedLevelIncome = levelIncomeData.slice(offset, offset + pageSize);

        res.json({ levelIncome: paginatedLevelIncome, pagination: { currentPage: page, pageSize, totalCount } });

    } catch (error) {
        console.error('Error fetching level income data:', error);
        res.status(500).json({ message: 'Failed to fetch level income data', error: error.detail });
    } finally {
        client.release();
    }
});


async function calculateLevelIncome(userId, client) {
    try {
        const levelIncomeData = [];
        const boardTypes = ['Silver', 'Gold', 'Diamond', 'Platinum', 'King']; // Array of board types

        for (const boardType of boardTypes) {
            const boardGenealogyTable = `${boardType.toLowerCase()}boardgenealogy`;
            const levelIncomesForBoard = await calculateLevelIncomeForBoard(userId, boardType, boardGenealogyTable, client);
            levelIncomeData.push(...levelIncomesForBoard); //Combine incomes from all boards
        }

        return levelIncomeData;
    } catch (error) {
        console.error('Error calculating level income:', error);
        throw error;
    }
}



async function calculateLevelIncomeForBoard(userId, boardType, boardGenealogyTable, client) {
    const levelIncomes = [];
    try {
        const { rows: genealogyRows } = await client.query(
            `SELECT * FROM ${boardGenealogyTable} WHERE user_id = $1`,
            [userId]
        );

        if (!genealogyRows || genealogyRows.length === 0) {
            return []; // Handle cases where genealogy data is missing
        }

        const genealogyData = genealogyRows[0];
        const referrals = [];

        for (let level = 1; level <= 5; level++) {
            const memberIds = getReferralsAtLevelFromGenealogy(genealogyData, level); // Helper function (below)
            referrals.push(...memberIds); //Add referrals from all levels
        }

        if (referrals.length > 0) {
            const referralIds = referrals.map(referral => client.escapeLiteral(referral)).join(',');
            const { rows } = await client.query(`
                SELECT 
                    SUM(wt.amount) as total_amount, 
                    COUNT(*) as total_id, 
                    MAX(wt.transactiondate) AS max_date,
                    wt.toid
                FROM wallettransactions wt
                WHERE toid IN (${referralIds})
                    AND wt.transactiontype LIKE '%_BOARD_LEVEL_INCOME' --Filter for board level incomes
                GROUP BY wt.toid;
            `);

            rows.forEach(row => {
                levelIncomes.push({
                    member: row.toid,
                    totalAmount: row.total_amount,
                    totalIds: row.total_id,
                    date: row.max_date,
                    view: true //or some way to show more details.
                });
            });
        }


        return levelIncomes;
    } catch (error) {
        console.error(`Error calculating level income for ${boardType}:`, error);
        throw error;
    }
}

function getReferralsAtLevelFromGenealogy(genealogyData, level) {
    const memberKey = `member${level}`;
    return genealogyData[memberKey] ? [genealogyData[memberKey]] : [];
}

app.get('/tree-view', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || "";
        const offset = (page - 1) * pageSize;

        // 1. Get the user's genealogy data
        const genealogyQuery = `SELECT * FROM genealogy WHERE user_id = $1`;
        const { rows: genealogyRows } = await client.query(genealogyQuery, [userId]);

        if (!genealogyRows || !genealogyRows.length) {
            return res.status(404).json({ message: "Genealogy data not found for this user. Check user ID." });
        }

        const genealogyData = genealogyRows[0];
        const members = [];
        for (let i = 1; i <= 4; i++) {
            const memberId = genealogyData[`member${i}`];
            if (memberId) members.push(memberId);
        }

        // Handle empty members array
        if (members.length === 0) {
            return res.json({ treeData: [], pagination: { currentPage: page, pageSize, totalCount: 0 } });
        }


        // Create a map for efficient status and rebirth balance lookups
        const userStatusMap = new Map();
        const userRebirthBalanceMap = new Map();

        //More efficient combined query - only one database call
        const combinedQuery = `
            SELECT 
                u.user_id, u.username, u.created_at, u.status, u.rebirth_balance,
                COUNT(*) OVER () as total_count
            FROM users u
            WHERE u.user_id = ANY($1)  -- Use ANY operator for arrays
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3))
            ORDER BY u.created_at DESC
            LIMIT $4 OFFSET $5
        `;

        const { rows: users } = await client.query(combinedQuery, [members, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset]);

        const totalCount = users.length > 0 ? users[0].total_count : 0; //Get total count from the first row

        users.forEach(row => {
            userStatusMap.set(row.user_id, row.status);
            userRebirthBalanceMap.set(row.user_id, row.rebirth_balance);
        });

        const treeData = users.map(user => ({
            ...user,
            status: userStatusMap.get(user.user_id),
            memberType: members.includes(user.user_id) ? 'Direct' : 'Indirect',
            totalCount: 0,
            amount: userRebirthBalanceMap.get(user.user_id) || 0
        }));

        res.json({ treeData, pagination: { currentPage: page, pageSize, totalCount } });
    } catch (error) {
        console.error("Error fetching tree view data:", error);
        res.status(500).json({ message: `Failed to fetch tree view data: ${error.message}` });
    } finally {
        client.release();
    }
});

app.get('/api/members', (req, res) => {
    const { search = '', page = 1, limit = 10 } = req.query;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);

    let filteredMembers = members.filter(member =>
        member.member.toLowerCase().includes(search.toLowerCase())
    );

    const paginatedMembers = filteredMembers.slice(startIndex, endIndex);
    const totalCount = filteredMembers.length;

    res.json({
        members: paginatedMembers,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
    });
});

app.get('/silver-board-tree-view', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || "";
        const offset = (page - 1) * pageSize;

        // 1. Check if the user is on the Silver Board
        if (!(await isUserOnSilverOrHigherBoard(userId))) {
            return res.status(403).json({ message: "You are not on the Silver Board or higher." });
        }


        const silverBoardGenealogyQuery = `SELECT * FROM silverboardgenealogy WHERE user_id = $1`;
        const { rows: silverBoardGenealogyRows } = await client.query(silverBoardGenealogyQuery, [userId]);


        if (!silverBoardGenealogyRows || !silverBoardGenealogyRows.length) {
            return res.status(404).json({ message: "Silver Board genealogy data not found for this user." });
        }


        const silverBoardGenealogyData = silverBoardGenealogyRows[0];
        const silverBoardMembers = [];


        for (let i = 1; i <= 5; i++) {
            const memberId = silverBoardGenealogyData[`member${i}`];
            if (memberId) silverBoardMembers.push(memberId);
        }

        const userStatusMap = new Map();
        const userSilverBoardBalanceMap = new Map();  // Map for Silver Board Balance

        // Efficiently fetch required user data
        const combinedQuery = `
            SELECT 
                u.user_id, u.username, u.created_at, u.status, b.earnings as silver_board_income 
            FROM users u
            JOIN boards b ON u.user_id = b.userid AND b.boardtype = 'SILVER' -- Join with boards table
            WHERE u.user_id IN (${silverBoardMembers.map(id => client.escapeLiteral(id)).join(',')})
              AND (LOWER(u.username) LIKE LOWER($1) OR LOWER(u.user_id) LIKE LOWER($2))
        `;

        const { rows: combinedRows } = await client.query(combinedQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);

        combinedRows.forEach(row => {
            userStatusMap.set(row.user_id, row.status);
            userSilverBoardBalanceMap.set(row.user_id, row.silver_board_income); // Store Silver Board Balance
        });

        const usersQuery = `
          SELECT COUNT(*) OVER () AS total_count, u.user_id, u.username, u.created_at
          FROM users u
          WHERE u.user_id IN (${silverBoardMembers.map(id => client.escapeLiteral(id)).join(',')})
            AND (LOWER(u.username) LIKE LOWER($1) OR LOWER(u.user_id) LIKE LOWER($2))
          ORDER BY u.created_at DESC
          LIMIT $3 OFFSET $4
      `;

        const { rows: users } = await client.query(usersQuery, [`%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset]);
        const totalCount = users.length > 0 ? users[0].total_count : 0;

        const treeData = users.map(user => ({
            ...user,
            status: userStatusMap.get(user.user_id),
            memberType: silverBoardMembers.includes(user.user_id) ? 'Direct' : 'Indirect',
            amount: userSilverBoardBalanceMap.get(user.user_id) || 0 // Use Silver Board balance
        }));

        res.json({
            treeData,
            pagination: { currentPage: page, pageSize, totalCount },
        });
    } catch (error) {
        console.error("Error fetching Silver Board tree view data:", error);
        res.status(500).json({ message: `Failed to fetch tree view data: ${error.message}` });
    } finally {
        client.release();
    }
});

app.get('/rebirth-income/:id', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const requestedUserId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        // Verify if the requested user exists
        const userExists = await validateIntroducerId(requestedUserId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Query for rebirth income
        const rebirthIncomeResult = await client.query(`
            SELECT wt.transactionid, wt.transactiondate, wt.amount, 
                   u.username AS user_username, u.user_id AS user_id,
                   ru.username AS referral_username, ru.user_id AS referral_id,
                   ru.total_balance AS referral_balance, -- Include the total_balance of referral_id
                   CASE
                       WHEN g.treelevel1 = $1 THEN 1
                       WHEN g.treelevel2 = $1 THEN 2
                       WHEN g.treelevel3 = $1 THEN 3
                       WHEN g.treelevel4 = $1 THEN 4
                       ELSE NULL
                   END AS level
            FROM wallettransactions wt
            JOIN users u ON wt.toid = u.user_id
            LEFT JOIN users ru ON wt.fromid = ru.user_id
            LEFT JOIN genealogy g ON g.user_id = ru.user_id -- Match referral_id in genealogy
            WHERE wt.transactiontype = 'REBIRTH_INCOME'
              AND wt.toid = $1
              AND ($1 IN (g.treelevel1, g.treelevel2, g.treelevel3, g.treelevel4))
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3) OR 
                   LOWER(ru.username) LIKE LOWER($4) OR LOWER(ru.user_id) LIKE LOWER($5)) 
            ORDER BY wt.transactiondate DESC
            LIMIT $6 OFFSET $7
        `, [requestedUserId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset]);

        // Query for total count
        const totalCountResult = await client.query(`
            SELECT COUNT(*) AS total
            FROM wallettransactions wt
            JOIN users u ON wt.toid = u.user_id
            LEFT JOIN users ru ON wt.fromid = ru.user_id
            LEFT JOIN genealogy g ON g.user_id = ru.user_id -- Match referral_id in genealogy
            WHERE wt.transactiontype = 'REBIRTH_INCOME'
              AND wt.toid = $1
              AND ($1 IN (g.treelevel1, g.treelevel2, g.treelevel3, g.treelevel4))
              AND (LOWER(u.username) LIKE LOWER($2) OR LOWER(u.user_id) LIKE LOWER($3) OR 
                   LOWER(ru.username) LIKE LOWER($4) OR LOWER(ru.user_id) LIKE LOWER($5))
        `, [requestedUserId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);

        const totalCount = parseInt(totalCountResult.rows[0].total, 10);

        res.json({
            rebirthIncome: rebirthIncomeResult.rows,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });

    } catch (error) {
        console.error('Error fetching rebirth income:', error);
        res.status(500).json({ message: 'Failed to fetch rebirth income' });
    } finally {
        client.release();
    }
});

app.get('/silver-board-team', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const team = {};

        for (let level = 1; level <= 5; level++) { // Silver board has 6 levels
            const referrals = await getSilverBoardReferralsAtLevel(userId, level, client);

            const levelData = {
                active: 0,
                inactive: 0
            };

            if (referrals.length > 0) {
                const referralIds = referrals.map(r => `'${r}'`).join(',');
                const { rows } = await client.query(`
                    SELECT user_id, status
                    FROM users
                    WHERE user_id IN (${referralIds})
                `);
                rows.forEach(({ status }) => {
                    levelData[status.toLowerCase()] = (levelData[status.toLowerCase()] || 0) + 1;
                });
            }
            team[`level${level}`] = levelData;
        }

        res.json({ team });
    } catch (error) {
        console.error('Error fetching Silver Board team data:', error);
        res.status(500).json({ message: 'Failed to fetch Silver Board team data' });
    } finally {
        client.release();
    }
});


async function getSilverBoardReferralsAtLevel(userId, level, client) {
    if (level === 1) {
        try {
            const { rows } = await client.query(`
              SELECT member1, member2, member3, member4,member5
              FROM silverboardgenealogy 
              WHERE user_id = $1
          `, [userId]);

            if (!rows[0]) return [];

            // Filter out null values to get the actual referral IDs
            return Object.values(rows[0]).filter(val => val !== null);
        } catch (error) {
            console.error(`Error getting Silver Board referrals at level 1:`, error);
            return []; // Return empty array on error
        }
    } else {
        const previousLevelReferrals = await getSilverBoardReferralsAtLevel(userId, level - 1, client);
        if (previousLevelReferrals.length === 0) return [];


        const referralIds = previousLevelReferrals.map(r => `'${r}'`).join(',');
        try {
            const { rows } = await client.query(`
                SELECT member1, member2, member3, member4, member5
                FROM silverboardgenealogy -- Silver board genealogy table
                WHERE user_id IN (${referralIds})
            `);

            return rows.flatMap(row => Object.values(row).filter(val => val !== null));
        } catch (error) {
            console.error(`Error getting Silver Board referrals at level ${level}:`, error);
            return []; // Return empty on error
        }
    }
}

app.get('/gold-board-team', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const team = {};

        for (let level = 1; level <= 5; level++) { // Silver board has 6 levels
            const referrals = await getGoldBoardReferralsAtLevel(userId, level, client);

            const levelData = {
                active: 0,
                inactive: 0
            };

            if (referrals.length > 0) {
                const referralIds = referrals.map(r => `'${r}'`).join(',');
                const { rows } = await client.query(`
                    SELECT user_id, status
                    FROM users
                    WHERE user_id IN (${referralIds})
                `);
                rows.forEach(({ status }) => {
                    levelData[status.toLowerCase()] = (levelData[status.toLowerCase()] || 0) + 1;
                });
            }
            team[`level${level}`] = levelData;
        }

        res.json({ team });
    } catch (error) {
        console.error('Error fetching Silver Board team data:', error);
        res.status(500).json({ message: 'Failed to fetch Silver Board team data' });
    } finally {
        client.release();
    }
});


async function getGoldBoardReferralsAtLevel(userId, level, client) {
    if (level === 1) {
        try {
            const { rows } = await client.query(`
              SELECT member1, member2, member3, member4,member5
              FROM goldboardgenealogy 
              WHERE user_id = $1
          `, [userId]);

            if (!rows[0]) return [];

            // Filter out null values to get the actual referral IDs
            return Object.values(rows[0]).filter(val => val !== null);
        } catch (error) {
            console.error(`Error getting Silver Board referrals at level 1:`, error);
            return []; // Return empty array on error
        }
    } else {
        const previousLevelReferrals = await getSilverBoardReferralsAtLevel(userId, level - 1, client);
        if (previousLevelReferrals.length === 0) return [];


        const referralIds = previousLevelReferrals.map(r => `'${r}'`).join(',');
        try {
            const { rows } = await client.query(`
                SELECT member1, member2, member3, member4, member5
                FROM goldboardgenealogy 
                WHERE user_id IN (${referralIds})
            `);

            return rows.flatMap(row => Object.values(row).filter(val => val !== null));
        } catch (error) {
            console.error(`Error getting Silver Board referrals at level ${level}:`, error);
            return []; // Return empty on error
        }
    }
}

app.get('/diamond-board-team', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const team = {};

        for (let level = 1; level <= 5; level++) { // Silver board has 6 levels
            const referrals = await getdiamondBoardReferralsAtLevel(userId, level, client);

            const levelData = {
                active: 0,
                inactive: 0
            };

            if (referrals.length > 0) {
                const referralIds = referrals.map(r => `'${r}'`).join(',');
                const { rows } = await client.query(`
                    SELECT user_id, status
                    FROM users
                    WHERE user_id IN (${referralIds})
                `);
                rows.forEach(({ status }) => {
                    levelData[status.toLowerCase()] = (levelData[status.toLowerCase()] || 0) + 1;
                });
            }
            team[`level${level}`] = levelData;
        }

        res.json({ team });
    } catch (error) {
        console.error('Error fetching Silver Board team data:', error);
        res.status(500).json({ message: 'Failed to fetch Silver Board team data' });
    } finally {
        client.release();
    }
});


async function getdiamondBoardReferralsAtLevel(userId, level, client) {
    if (level === 1) {
        try {
            const { rows } = await client.query(`
              SELECT member1, member2, member3, member4,member5
              FROM diamondboardgenealogy 
              WHERE user_id = $1
          `, [userId]);

            if (!rows[0]) return [];

            // Filter out null values to get the actual referral IDs
            return Object.values(rows[0]).filter(val => val !== null);
        } catch (error) {
            console.error(`Error getting Silver Board referrals at level 1:`, error);
            return []; // Return empty array on error
        }
    } else {
        const previousLevelReferrals = await getdiamondBoardReferralsAtLevel(userId, level - 1, client);
        if (previousLevelReferrals.length === 0) return [];


        const referralIds = previousLevelReferrals.map(r => `'${r}'`).join(',');
        try {
            const { rows } = await client.query(`
                SELECT member1, member2, member3, member4, member5
                FROM diamondboardgenealogy 
                WHERE user_id IN (${referralIds})
            `);

            return rows.flatMap(row => Object.values(row).filter(val => val !== null));
        } catch (error) {
            console.error(`Error getting Silver Board referrals at level ${level}:`, error);
            return []; // Return empty on error
        }
    }
}

app.get('/platinum-board-team', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const team = {};

        for (let level = 1; level <= 5; level++) { // Silver board has 6 levels
            const referrals = await getplatinumBoardReferralsAtLevel(userId, level, client);

            const levelData = {
                active: 0,
                inactive: 0
            };

            if (referrals.length > 0) {
                const referralIds = referrals.map(r => `'${r}'`).join(',');
                const { rows } = await client.query(`
                    SELECT user_id, status
                    FROM users
                    WHERE user_id IN (${referralIds})
                `);
                rows.forEach(({ status }) => {
                    levelData[status.toLowerCase()] = (levelData[status.toLowerCase()] || 0) + 1;
                });
            }
            team[`level${level}`] = levelData;
        }

        res.json({ team });
    } catch (error) {
        console.error('Error fetching Silver Board team data:', error);
        res.status(500).json({ message: 'Failed to fetch Silver Board team data' });
    } finally {
        client.release();
    }
});


async function getplatinumBoardReferralsAtLevel(userId, level, client) {
    if (level === 1) {
        try {
            const { rows } = await client.query(`
              SELECT member1, member2, member3, member4,member5
              FROM platiumboardgenealogy 
              WHERE user_id = $1
          `, [userId]);

            if (!rows[0]) return [];

            // Filter out null values to get the actual referral IDs
            return Object.values(rows[0]).filter(val => val !== null);
        } catch (error) {
            console.error(`Error getting Silver Board referrals at level 1:`, error);
            return []; // Return empty array on error
        }
    } else {
        const previousLevelReferrals = await getplatinumBoardReferralsAtLevel(userId, level - 1, client);
        if (previousLevelReferrals.length === 0) return [];


        const referralIds = previousLevelReferrals.map(r => `'${r}'`).join(',');
        try {
            const { rows } = await client.query(`
                SELECT member1, member2, member3, member4, member5
                FROM platinumboardgenealogy 
                WHERE user_id IN (${referralIds})
            `);

            return rows.flatMap(row => Object.values(row).filter(val => val !== null));
        } catch (error) {
            console.error(`Error getting Silver Board referrals at level ${level}:`, error);
            return []; // Return empty on error
        }
    }
}

app.get('/king-board-team', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const team = {};

        for (let level = 1; level <= 5; level++) { // Silver board has 6 levels
            const referrals = await getkingBoardReferralsAtLevel(userId, level, client);

            const levelData = {
                active: 0,
                inactive: 0
            };

            if (referrals.length > 0) {
                const referralIds = referrals.map(r => `'${r}'`).join(',');
                const { rows } = await client.query(`
                    SELECT user_id, status
                    FROM users
                    WHERE user_id IN (${referralIds})
                `);
                rows.forEach(({ status }) => {
                    levelData[status.toLowerCase()] = (levelData[status.toLowerCase()] || 0) + 1;
                });
            }
            team[`level${level}`] = levelData;
        }

        res.json({ team });
    } catch (error) {
        console.error('Error fetching Silver Board team data:', error);
        res.status(500).json({ message: 'Failed to fetch Silver Board team data' });
    } finally {
        client.release();
    }
});


async function getkingBoardReferralsAtLevel(userId, level, client) {
    if (level === 1) {
        try {
            const { rows } = await client.query(`
              SELECT member1, member2, member3, member4,member5
              FROM kingboardgenealogy 
              WHERE user_id = $1
          `, [userId]);

            if (!rows[0]) return [];

            // Filter out null values to get the actual referral IDs
            return Object.values(rows[0]).filter(val => val !== null);
        } catch (error) {
            console.error(`Error getting Silver Board referrals at level 1:`, error);
            return []; // Return empty array on error
        }
    } else {
        const previousLevelReferrals = await getkingBoardReferralsAtLevel(userId, level - 1, client);
        if (previousLevelReferrals.length === 0) return [];


        const referralIds = previousLevelReferrals.map(r => `'${r}'`).join(',');
        try {
            const { rows } = await client.query(`
                SELECT member1, member2, member3, member4, member5
                FROM kingboardgenealogy 
                WHERE user_id IN (${referralIds})
            `);

            return rows.flatMap(row => Object.values(row).filter(val => val !== null));
        } catch (error) {
            console.error(`Error getting Silver Board referrals at level ${level}:`, error);
            return []; // Return empty on error
        }
    }
}

app.post('/transfer-funds', authenticateToken, async (req, res) => {
    const client = await pgPool.connect(); // Acquire client from pool
    try {
        const fromUserId = req.user.userId;
        const { toUserId, amount } = req.body;

        if (!toUserId || !amount || amount < 500 || isNaN(amount)) { // Input validation
            return res.status(400).json({ message: 'Invalid transfer details. Amount must be a number greater than or equal to 500.' });
        }

        try {
            await client.query('BEGIN'); // Start transaction

            // Check recipient existence and fetch sender balance in *one* query
            const { rows } = await client.query(
                'SELECT 1 AS recipient_exists, (SELECT fund_income FROM users WHERE user_id = $1) AS sender_balance FROM users WHERE user_id = $2',
                [fromUserId, toUserId]
            );

            if (!rows[0]?.recipient_exists) { // Check recipient
                throw new Error('Recipient user not found.');
            }

            const senderBalance = parseFloat(rows[0].sender_balance);
            if (isNaN(senderBalance) || senderBalance < amount) {
                throw new Error('Insufficient balance.'); // More specific
            }

            // Update balances atomically
            await client.query(
                'UPDATE users SET fund_income = fund_income - $1 WHERE user_id = $2',
                [amount, fromUserId]
            );
            await client.query(
                'UPDATE users SET fund_income = fund_income + $1 WHERE user_id = $2',
                [amount, toUserId]
            );

            await recordWalletTransaction(fromUserId, amount, "FUND_TRANSFER", toUserId); // Pass the client
            await client.query('COMMIT'); // Commit only after ALL operations succeed
            res.json({ message: `Transferred Rs. ${amount} to ${toUserId} successfully.` });

        } catch (transferError) { // Catch errors *inside* the transaction block
            await client.query('ROLLBACK'); // Rollback on any error within the transaction
            console.error('Transfer error:', transferError);

            // Send an appropriate error response based on what happened
            if (transferError.message.includes('Recipient')) {
                res.status(404).json({ message: 'Recipient user not found.' });
            } else if (transferError.message.includes('Insufficient')) {
                res.status(400).json({ message: 'Insufficient balance.' });
            } else {
                res.status(500).json({ message: 'Fund transfer failed.' });
            }
        }

    } catch (error) { // Outer catch for any client acquisition errors
        console.error('Error acquiring client or other error:', error);
        res.status(500).json({ message: 'Fund transfer failed.' });
    } finally {
        if (client) client.release();  // Always release in a `finally` block
    }
});

app.post('/internal-transfer', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const { amount } = req.body;

        if (!amount || amount <= 0 || isNaN(amount)) {
            return res.status(400).json({ message: 'Invalid amount.' });
        }

        await client.query('BEGIN'); // Start transaction

        try {
            // 1. Find a suitable board income to deduct from
            const boardTypes = ['silver', 'gold', 'diamond', 'platinum', 'king'];
            let sourceBoard = null;

            for (const boardType of boardTypes) {
                const boardIncomeColumn = `${boardType}_board_income`;
                const { rows } = await client.query(`SELECT ${boardIncomeColumn} FROM users WHERE user_id = $1`, [userId]);

                if (rows[0] && parseFloat(rows[0][boardIncomeColumn]) >= amount) {
                    sourceBoard = boardType;
                    break; // Found a suitable board
                }
            }

            if (!sourceBoard) {
                throw new Error('Insufficient balance in any board income.');
            }


            const sourceBoardIncomeColumn = `${sourceBoard}_board_income`;


            await client.query(`
                UPDATE users 
                SET ${sourceBoardIncomeColumn} = ${sourceBoardIncomeColumn} - $1, 
                    direct_referral_income = direct_referral_income + $1 
                WHERE user_id = $2
            `, [amount, userId]);

            // Record transaction
            await recordWalletTransaction(
                userId,
                amount,
                'INTERNAL_TRANSFER', // New transaction type
                userId // Since it's an internal transfer, from and to are the same
            );

            await client.query('COMMIT'); // Commit transaction
            res.json({ message: `Transferred Rs. ${amount} from ${sourceBoard} board income to direct referral income successfully.` });

        } catch (err) {
            await client.query('ROLLBACK'); // Rollback on error
            console.error("Error during internal transfer:", err);
            res.status(500).json({ message: err.message || "Internal transfer failed." }); // Return specific or generic error
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal transfer failed.' });
    } finally {
        client.release();
    }
});

app.post('/aw-to-ew', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const { amount } = req.body;

        if (!amount || amount <= 0 || isNaN(amount)) {
            return res.status(400).json({ message: 'Invalid amount.' });
        }

        await client.query('BEGIN');

        try {
            // 1. Check direct_referral_income balance
            const { rows: userRows } = await client.query('SELECT direct_referral_income FROM users WHERE user_id = $1', [userId]);

            if (!userRows[0] || parseFloat(userRows[0].direct_referral_income) < amount) {
                throw new Error('Insufficient direct referral income.');
            }

            // 2. Fetch the user's active boards from the `boards` table
            const { rows: userBoards } = await client.query(`
                SELECT boardtype 
                FROM boards 
                WHERE userid = $1 AND status='ACTIVE'
            `, [userId]);

            if (userBoards.length === 0) {
                throw new Error('User is not active on any board.');
            }

            // Define board hierarchy
            const boardHierarchy = ['silver', 'gold', 'diamond', 'platinum', 'king'];

            // Sort the user's active boards by the board hierarchy
            const sortedBoards = userBoards.sort((a, b) => {
                return boardHierarchy.indexOf(a.boardtype) - boardHierarchy.indexOf(b.boardtype);
            });

            // The top board (first in the sorted list)
            const topBoard = sortedBoards[0].boardtype.toLowerCase();
            const targetBoardIncomeColumn = `${topBoard}_board_income`;

            // 3. Deduct the amount from direct_referral_income and add to the selected board's income
            await client.query(`
                UPDATE users 
                SET direct_referral_income = direct_referral_income - $1,
                    ${targetBoardIncomeColumn} = ${targetBoardIncomeColumn} + $1
                WHERE user_id = $2
            `, [amount, userId]);

            await client.query(`
                UPDATE boards SET earnings = earnings + $1 WHERE userid = $2
            `, [amount, userId])

            // 4. Record the wallet transaction
            await recordWalletTransaction(userId, amount, 'AW_TO_EW_TRANSFER', userId);

            await client.query('COMMIT');
            res.json({
                message: `Transferred Rs. ${amount} from direct referral income to ${topBoard} board income successfully.`
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error("Error during internal transfer:", err);
            res.status(500).json({ message: err.message || 'Internal transfer failed.' });
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal transfer failed.' });
    } finally {
        client.release();
    }
});

app.post('/ew-to-uw', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        let { amount } = req.body;
        amount = parseFloat(amount);

        if (!amount || amount <= 0 || isNaN(amount)) {
            return res.status(400).json({ message: 'Invalid amount.' });
        }

        const serviceChargeRate = 0.10;
        const serviceCharge = amount * serviceChargeRate;
        const amountAfterCharge = amount - serviceCharge;

        await client.query('BEGIN');

        try {
            const { rows: userBoards } = await client.query(`
                SELECT boardtype, earnings 
                FROM boards 
                WHERE userid = $1 AND status = 'ACTIVE'
            `, [userId]);

            if (userBoards.length === 0) {
                throw new Error('User is not active on any board.');
            }

            const boardHierarchy = ['silver', 'gold', 'diamond', 'platinum', 'king'];
            const sortedBoards = userBoards.sort((a, b) => boardHierarchy.indexOf(a.boardtype) - boardHierarchy.indexOf(b.boardtype));
            const topBoard = sortedBoards[0].boardtype.toLowerCase();
            const targetBoardIncomeColumn = `${topBoard}_board_income`;
            const targetBoardUpgradeColumn = `${topBoard}_upgrade`;

            const earnings = parseFloat(sortedBoards[0].earnings);
            if (earnings < amount) {
                throw new Error(`Insufficient earnings in ${topBoard} board. Available earnings: Rs. ${earnings}. Amount including 10% charges is ${amount}`);
            }

            await client.query(`
                UPDATE boards 
                SET earnings = earnings - $1
                WHERE userid = $2 AND boardtype = $3
            `, [amount, userId, topBoard.toUpperCase()]);

            await client.query(`
                UPDATE users 
                SET ${targetBoardIncomeColumn} = ${targetBoardIncomeColumn} - $1, ${targetBoardUpgradeColumn} = ${targetBoardUpgradeColumn} + $2
                WHERE user_id = $3
            `, [amountAfterCharge, amountAfterCharge, userId]);

            await recordWalletTransaction(userId, amount, 'EW_TO_UW_TRANSFER', userId);
            await recordWalletTransaction(userId, serviceCharge, 'EW_TO_UW_SERVICE_CHARGE', userId);

            await client.query('COMMIT');
            res.json({
                message: `Transferred Rs. ${amountAfterCharge} to upgrade wallet (Rs. ${serviceCharge} deducted as service charge).`
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error("Error during transfer:", err);
            res.status(500).json({ message: err.message || 'Transfer failed.' });
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Transfer failed.' });
    } finally {
        client.release();
    }
});


app.get('/aw-to-ew-history', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;


        const query = `
            SELECT wt.transactionid, wt.transactiondate, wt.amount
            FROM wallettransactions wt
            WHERE wt.transactiontype = 'AW_TO_EW_TRANSFER' AND wt.fromid = $1  -- Correct transaction type
            ORDER BY wt.transactiondate DESC
            LIMIT $2 OFFSET $3;
        `;
        const values = [userId, pageSize, offset];
        const { rows: transactions } = await client.query(query, values);

        const countQuery = `
          SELECT COUNT(*) AS total
          FROM wallettransactions
          WHERE transactiontype = 'AW_TO_EW_TRANSFER' AND fromid = $1 -- Correct transaction type
        `;

        const { rows: countResult } = await client.query(countQuery, [userId]);

        const totalCount = parseInt(countResult[0].total, 10);
        res.json({ transactions, pagination: { currentPage: page, pageSize, totalCount } });

    } catch (error) {
        console.error('Error fetching AW to EW transfer history:', error);
        res.status(500).json({ message: 'Failed to fetch AW to EW history' });
    } finally {
        client.release();
    }
});

app.get('/ew-to-uw-history', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        // Query to fetch transactions with pagination
        const query = `
            SELECT wt.transactionid, wt.transactiondate, wt.amount, wt.transactiontype
            FROM wallettransactions wt
            WHERE wt.transactiontype = 'EW_TO_UW_TRANSFER' AND wt.fromid = $1 -- Correct transaction type
            ORDER BY wt.transactiondate DESC
            LIMIT $2 OFFSET $3;
        `;
        const values = [userId, pageSize, offset];
        const { rows: transactions } = await client.query(query, values);

        // Query to fetch total count of transactions
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM wallettransactions
            WHERE transactiontype = 'EW_TO_UW_TRANSFER' AND fromid = $1 
        `;
        const { rows: countResult } = await client.query(countQuery, [userId]);

        const totalCount = parseInt(countResult[0].total, 10);

        res.json({ transactions, pagination: { currentPage: page, pageSize, totalCount } });

    } catch (error) {
        console.error('Error fetching EW to UW transfer history:', error);
        res.status(500).json({ message: 'Failed to fetch EW to UW history' });
    } finally {
        client.release();
    }
});

app.get('/ew-balance', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;

        const { rows: userBoards } = await client.query(`
                SELECT boardtype, earnings 
                FROM boards 
                WHERE userid = $1 AND status = 'ACTIVE'
            `, [userId]);


        if (userBoards.length === 0) { //if no boards are found return 0
            res.json({ balance: 0 });
        }


        // Define board hierarchy
        const boardHierarchy = ['silver', 'gold', 'diamond', 'platinum', 'king'];

        // Sort the user's active boards by the board hierarchy
        const sortedBoards = userBoards.sort((a, b) => {
            return boardHierarchy.indexOf(a.boardtype) - boardHierarchy.indexOf(b.boardtype);
        });
        const balance = parseFloat(sortedBoards[0].earnings);


        res.json({ balance });  // Return the balance
    } catch (error) {
        console.error('Error fetching EW balance:', error);
        res.status(500).json({ message: 'Failed to fetch EW balance' }); // Appropriate error response
    } finally {
        client.release();
    }
});

app.get('/current-balance', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;

        const result = await client.query(`
            SELECT 
                fund_income,
                direct_referral_income,
                silver_board_income,
                gold_board_income,
                diamond_board_income,
                platinum_board_income,
                king_board_income,
                rebirth_balance,
                total_balance,
                silver_upgrade,
                gold_upgrade,
                diamond_upgrade,
                platinum_upgrade,
                king_upgrade  
            FROM users
            WHERE user_id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const balance = result.rows[0];
        res.json(balance);

    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ message: 'Failed to fetch balance' });
    } finally {
        client.release();
    }
});

app.get('/transaction-send-income', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;

        // Query to get all amounts for FUND_TRANSFER transactions
        const result = await client.query(`
            SELECT 
                SUM(amount) AS total_amount  --Calculate the sum of amounts
            FROM wallettransactions
            WHERE transactiontype = 'FUND_TRANSFER' AND fromid = $1
        `, [userId]);

        if (result.rows.length === 0) {
            //If no transactions are found, return total amount as 0
            return res.json({ total_amount: 0 });
        }

        //Access total_amount from the result row
        const totalAmount = result.rows[0].total_amount;
        res.json({ total_amount: totalAmount }); // Return total amount

    } catch (error) {
        console.error('Error fetching total amount:', error);
        res.status(500).json({ message: 'Failed to fetch total amount.' });
    } finally {
        client.release();
    }
});

app.get('/transaction-receive-income', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;

        // Query to calculate the sum of received amounts
        const result = await client.query(`
            SELECT 
                SUM(amount) AS total_amount
            FROM wallettransactions
            WHERE transactiontype = 'FUND_TRANSFER' AND toid = $1
        `, [userId]);

        if (result.rows.length === 0) {
            // Return 0 if no transactions found
            return res.json({ total_amount: 0 });
        }

        // Access and return the total amount
        const totalAmount = parseFloat(result.rows[0].total_amount);
        res.json({ total_amount: totalAmount });

    } catch (error) {
        console.error('Error fetching total received amount:', error);
        res.status(500).json({ message: 'Failed to fetch total received amount.' });
    } finally {
        client.release();
    }
});

app.get('/transaction-wallet-transfer', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;

        // Query to calculate the sum of wallet transfer amounts
        const result = await client.query(`
            SELECT 
                SUM(amount) AS total_amount
            FROM wallettransactions
            WHERE transactiontype = 'INTERNAL_TRANSFER' AND fromid = $1
        `, [userId]);

        if (result.rows.length === 0) {
            // Return 0 if no transactions found
            return res.json({ total_amount: 0 });
        }

        // Access and return the total amount
        const totalAmount = parseFloat(result.rows[0].total_amount);
        res.json({ total_transfer_amount: totalAmount });

    } catch (error) {
        console.error('Error fetching total wallet transfer amount:', error);
        res.status(500).json({ message: 'Failed to fetch total wallet transfer amount.' });
    } finally {
        client.release();
    }
});

app.get('/internal-transfer-history', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        // Query to fetch internal transfer history with pagination
        const query = `
        SELECT transactionid, transactiondate, amount, transactiontype
        FROM wallettransactions
        WHERE transactiontype = 'INTERNAL_TRANSFER' AND fromid = $1
        ORDER BY transactiondate DESC  -- Corrected case
        LIMIT $2 OFFSET $3
    `;

        const values = [userId, pageSize, offset];
        const { rows: transactions } = await client.query(query, values);

        // Query for total count
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM wallettransactions
            WHERE transactiontype = 'INTERNAL_TRANSFER' AND fromid = $1
        `;
        const { rows: countResult } = await client.query(countQuery, [userId]);
        const totalCount = parseInt(countResult[0].total, 10);

        res.json({
            transactions,
            pagination: { currentPage: page, pageSize, totalCount }
        });
    } catch (error) {
        console.error('Error fetching internal transfer history:', error);
        res.status(500).json({ message: 'Failed to fetch history' });
    } finally {
        client.release();
    }
});

app.get('/silver-board-income', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        // Query to get silver board income with necessary joins
        const silverBoardIncomeResult = await client.query(`
            SELECT wt."transactionid", wt."transactiondate", wt."amount", 
                ru."username" AS "referralusername", ru."user_id" AS "referraluserid", 
                u."username" AS "userusername", u."user_id" AS "userid"    
            FROM "wallettransactions" wt
            JOIN "users" u ON wt."fromid" = u."user_id"  
            LEFT JOIN "users" ru ON wt."toid" = ru."user_id"  
            WHERE wt."transactiontype" = 'SILVER_BOARD_LEVEL_INCOME'
            AND wt."fromid" = $1                
            AND (LOWER(u."username") LIKE LOWER($2) OR LOWER(u."user_id") LIKE LOWER($3))
            ORDER BY wt."transactiondate" DESC
            LIMIT $4 OFFSET $5
        `, [userId, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset]);

        // Query to get total count for pagination
        const totalCountResult = await client.query(`
            SELECT COUNT(wt."transactionid") AS "total"  
            FROM "wallettransactions" wt
            LEFT JOIN "users" u ON wt."fromid" = u."user_id"  
            WHERE wt."transactiontype" = 'SILVER_BOARD'
            AND wt."fromid" = $1                     
            AND (LOWER(u."username") LIKE LOWER($2) OR LOWER(u."user_id") LIKE LOWER($3) OR u."user_id" IS NULL)
        `, [userId, `%${searchTerm}%`, `%${searchTerm}%`]);

        const totalCount = totalCountResult.rows[0].total;

        res.json({
            silverBoardIncome: silverBoardIncomeResult.rows,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });

    } catch (error) {
        console.error('Error fetching silver board income:', error);
        res.status(500).json({ message: 'Failed to fetch silver board income' });
    } finally {
        client.release();
    }
});

app.get('/gold-board-income', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        const goldBoardIncomeResult = await client.query(`
            SELECT wt."transactionid", wt."transactiondate", wt."amount", 
                ru."username" AS "referralusername", ru."user_id" AS "referraluserid", 
                u."username" AS "userusername", u."user_id" AS "userid"    
            FROM "wallettransactions" wt
            JOIN "users" u ON wt."fromid" = u."user_id"  
            LEFT JOIN "users" ru ON wt."toid" = ru."user_id"  
            WHERE wt."transactiontype" = 'GOLD_BOARD_LEVEL_INCOME'
            AND wt."fromid" = $1                
            AND (LOWER(u."username") LIKE LOWER($2) OR LOWER(u."user_id") LIKE LOWER($3))
            ORDER BY wt."transactiondate" DESC
            LIMIT $4 OFFSET $5
        `, [userId, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset]);

        const totalCountResult = await client.query(`
            SELECT COUNT(wt."transactionid") AS "total"  
            FROM "wallettransactions" wt
            LEFT JOIN "users" u ON wt."fromid" = u."user_id"  
            WHERE wt."transactiontype" = 'GOLD_BOARD'
            AND wt."fromid" = $1                     
            AND (LOWER(u."username") LIKE LOWER($2) OR LOWER(u."user_id") LIKE LOWER($3) OR u."user_id" IS NULL)
        `, [userId, `%${searchTerm}%`, `%${searchTerm}%`]);

        const totalCount = totalCountResult.rows[0].total;

        res.json({
            goldBoardIncome: goldBoardIncomeResult.rows,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });

    } catch (error) {
        console.error('Error fetching gold board income:', error);
        res.status(500).json({ message: 'Failed to fetch gold board income' });
    } finally {
        client.release();
    }
});

app.get('/diamond-board-income', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        const diamondBoardIncomeResult = await client.query(`
            SELECT wt."transactionid", wt."transactiondate", wt."amount", 
                ru."username" AS "referralusername", ru."user_id" AS "referraluserid", 
                u."username" AS "userusername", u."user_id" AS "userid"    
            FROM "wallettransactions" wt
            JOIN "users" u ON wt."fromid" = u."user_id"  
            LEFT JOIN "users" ru ON wt."toid" = ru."user_id"  
            WHERE wt."transactiontype" = 'DIAMOND_BOARD'
            AND wt."fromid" = $1                
            AND (LOWER(u."username") LIKE LOWER($2) OR LOWER(u."user_id") LIKE LOWER($3))
            ORDER BY wt."transactiondate" DESC
            LIMIT $4 OFFSET $5
        `, [userId, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset]);

        const totalCountResult = await client.query(`
            SELECT COUNT(wt."transactionid") AS "total"  
            FROM "wallettransactions" wt
            LEFT JOIN "users" u ON wt."fromid" = u."user_id"  
            WHERE wt."transactiontype" = 'DIAMOND_BOARD_LEVEL_INCOME'
            AND wt."fromid" = $1                     
            AND (LOWER(u."username") LIKE LOWER($2) OR LOWER(u."user_id") LIKE LOWER($3) OR u."user_id" IS NULL)
        `, [userId, `%${searchTerm}%`, `%${searchTerm}%`]);

        const totalCount = totalCountResult.rows[0].total;

        res.json({
            diamondBoardIncome: diamondBoardIncomeResult.rows,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });

    } catch (error) {
        console.error('Error fetching diamond board income:', error);
        res.status(500).json({ message: 'Failed to fetch diamond board income' });
    } finally {
        client.release();
    }
});

app.get('/platinum-board-income', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        const platinumBoardIncomeResult = await client.query(`
            SELECT wt."transactionid", wt."transactiondate", wt."amount", 
                ru."username" AS "referralusername", ru."user_id" AS "referraluserid", 
                u."username" AS "userusername", u."user_id" AS "userid"    
            FROM "wallettransactions" wt
            JOIN "users" u ON wt."fromid" = u."user_id"  
            LEFT JOIN "users" ru ON wt."toid" = ru."user_id"  
            WHERE wt."transactiontype" = 'PLATINUM_BOARD'
            AND wt."fromid" = $1                
            AND (LOWER(u."username") LIKE LOWER($2) OR LOWER(u."user_id") LIKE LOWER($3))
            ORDER BY wt."transactiondate" DESC
            LIMIT $4 OFFSET $5
        `, [userId, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset]);

        const totalCountResult = await client.query(`
            SELECT COUNT(wt."transactionid") AS "total"  
            FROM "wallettransactions" wt
            LEFT JOIN "users" u ON wt."fromid" = u."user_id"  
            WHERE wt."transactiontype" = 'PLATINUM_BOARD_LEVEL_INCOME'
            AND wt."fromid" = $1                     
            AND (LOWER(u."username") LIKE LOWER($2) OR LOWER(u."user_id") LIKE LOWER($3) OR u."user_id" IS NULL)
        `, [userId, `%${searchTerm}%`, `%${searchTerm}%`]);

        const totalCount = totalCountResult.rows[0].total;

        res.json({
            platinumBoardIncome: platinumBoardIncomeResult.rows,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });

    } catch (error) {
        console.error('Error fetching platinum board income:', error);
        res.status(500).json({ message: 'Failed to fetch platinum board income' });
    } finally {
        client.release();
    }
});

app.get('/king-board-income', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        const kingBoardIncomeResult = await client.query(`
            SELECT wt."transactionid", wt."transactiondate", wt."amount", 
                ru."username" AS "referralusername", ru."user_id" AS "referraluserid", 
                u."username" AS "userusername", u."user_id" AS "userid"    
            FROM "wallettransactions" wt
            JOIN "users" u ON wt."fromid" = u."user_id"  
            LEFT JOIN "users" ru ON wt."toid" = ru."user_id"  
            WHERE wt."transactiontype" = 'KING_BOARD_INCOME'
            AND wt."fromid" = $1                
            AND (LOWER(u."username") LIKE LOWER($2) OR LOWER(u."user_id") LIKE LOWER($3))
            ORDER BY wt."transactiondate" DESC
            LIMIT $4 OFFSET $5
        `, [userId, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset]);

        const totalCountResult = await client.query(`
            SELECT COUNT(wt."transactionid") AS "total"  
            FROM "wallettransactions" wt
            LEFT JOIN "users" u ON wt."fromid" = u."user_id"  
            WHERE wt."transactiontype" = 'KING_BOARD'
            AND wt."fromid" = $1                     
            AND (LOWER(u."username") LIKE LOWER($2) OR LOWER(u."user_id") LIKE LOWER($3) OR u."user_id" IS NULL)
        `, [userId, `%${searchTerm}%`, `%${searchTerm}%`]);

        const totalCount = totalCountResult.rows[0].total;

        res.json({
            kingBoardIncome: kingBoardIncomeResult.rows,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });

    } catch (error) {
        console.error('Error fetching king board income:', error);
        res.status(500).json({ message: 'Failed to fetch king board income' });
    } finally {
        client.release();
    }
});

app.get('/income-transactions', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        const mainQuery = `
            SELECT * FROM (
                SELECT 
                    wt.transactionid, 
                    wt.transactiondate, 
                    wt.amount, 
                    CASE 
                        WHEN wt.transactiontype = 'DIRECT_REFERRAL' THEN 'Sponsor Income'
                        WHEN wt.transactiontype = 'REBIRTH_INCOME' THEN 'Level Income (Rebirth)'
                        WHEN wt.transactiontype = 'SILVER_BOARD_LEVEL_INCOME' THEN 'Silver Board Income'
                        WHEN wt.transactiontype = 'GOLD_BOARD_LEVEL_INCOME' THEN 'Gold Board Income'
                        WHEN wt.transactiontype = 'DIAMOND_BOARD_LEVEL_INCOME' THEN 'Diamond Board Income'
                        WHEN wt.transactiontype = 'PLATINUM_BOARD_LEVEL_INCOME' THEN 'Platinum Board Income'
                        WHEN wt.transactiontype = 'KING_BOARD_LEVEL_INCOME' THEN 'King Board Income'
                        WHEN wt.transactiontype = 'SILVER_BOARD_JOIN' THEN 'Silver Board'
                        WHEN wt.transactiontype = 'GOLD_BOARD_JOIN' THEN 'Gold Board'
                        WHEN wt.transactiontype = 'DIAMOND_BOARD_JOIN' THEN 'Diamond Board'
                        WHEN wt.transactiontype = 'PLATINUM_BOARD_JOIN' THEN 'Platinum Board'
                        WHEN wt.transactiontype = 'KING_BOARD_JOIN' THEN 'King Board'
                        WHEN wt.transactiontype = 'REBIRTH_BONUS_REDISTRIBUTED' THEN 'Rebirth Bonus (Redistributed)'
                        WHEN wt.transactiontype = 'REBIRTH_BONUS' THEN 'Rebirth Bonus'
                        ELSE wt.transactiontype 
                    END AS income_type
                FROM wallettransactions wt
                WHERE wt.toid = $1
                   AND wt.transactiontype IN ('DIRECT_REFERRAL', 'REBIRTH_INCOME', 'SILVER_BOARD_LEVEL_INCOME','SILVER_BOARD_JOIN','GOLD_BOARD_JOIN','DIAMOND_BOARD_JOIN','PLATINUM_BOARD_JOIN','KING_BOARD_JOIN','GOLD_BOARD_LEVEL_INCOME','DIAMOND_BOARD_LEVEL_INCOME', 'PLATINUM_BOARD_LEVEL_INCOME', 'KING_BOARD_LEVEL_INCOME','REBIRTH_BONUS_REDISTRIBUTED','REBIRTH_BONUS')
            ) as subquery
            WHERE LOWER(income_type) LIKE LOWER($2) OR amount::TEXT LIKE $3
            ORDER BY transactiondate DESC
            LIMIT $4 OFFSET $5;
        `;

        const values = [userId, `%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const { rows: transactions } = await client.query(mainQuery, values);

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM (
                SELECT wt.transactionid, wt.transactiondate, wt.amount,
                       CASE 
                           WHEN wt.transactiontype = 'DIRECT_REFERRAL' THEN 'Sponsor Income'
                           WHEN wt.transactiontype = 'REBIRTH_INCOME' THEN 'Level Income (Rebirth)'
                           WHEN wt.transactiontype = 'SILVER_BOARD_LEVEL_INCOME' THEN 'Silver Board Income'
                           WHEN wt.transactiontype = 'GOLD_BOARD_LEVEL_INCOME' THEN 'Gold Board Income'
                           WHEN wt.transactiontype = 'DIAMOND_BOARD_LEVEL_INCOME' THEN 'Diamond Board Income'
                           WHEN wt.transactiontype = 'PLATINUM_BOARD_LEVEL_INCOME' THEN 'Platinum Board Income'
                           WHEN wt.transactiontype = 'KING_BOARD_LEVEL_INCOME' THEN 'King Board Income'
                           WHEN wt.transactiontype = 'SILVER_BOARD_JOIN' THEN 'Silver Board'
                           WHEN wt.transactiontype = 'GOLD_BOARD_JOIN' THEN 'Gold Board'
                           WHEN wt.transactiontype = 'DIAMOND_BOARD_JOIN' THEN 'Diamond Board'
                           WHEN wt.transactiontype = 'PLATINUM_BOARD_JOIN' THEN 'Platinum Board'
                           WHEN wt.transactiontype = 'KING_BOARD_JOIN' THEN 'King Board'
                           WHEN wt.transactiontype = 'REBIRTH_BONUS_REDISTRIBUTED' THEN 'Rebirth Bonus (Redistributed)'
                           WHEN wt.transactiontype = 'REBIRTH_BONUS' THEN 'Rebirth Bonus'
                           ELSE wt.transactiontype 
                       END AS income_type
                FROM wallettransactions wt
                WHERE wt.toid = $1
                   AND wt.transactiontype IN ('DIRECT_REFERRAL', 'REBIRTH_INCOME', 'SILVER_BOARD_LEVEL_INCOME','SILVER_BOARD_JOIN','GOLD_BOARD_JOIN','DIAMOND_BOARD_JOIN','PLATINUM_BOARD_JOIN','KING_BOARD_JOIN','GOLD_BOARD_LEVEL_INCOME','DIAMOND_BOARD_LEVEL_INCOME', 'PLATINUM_BOARD_LEVEL_INCOME', 'KING_BOARD_LEVEL_INCOME','REBIRTH_BONUS_REDISTRIBUTED','REBIRTH_BONUS')
            ) as subquery
            WHERE LOWER(income_type) LIKE LOWER($2) OR amount::TEXT LIKE $3;
        `;

        const countValues = [userId, `%${searchTerm}%`, `%${searchTerm}%`];
        const countResult = await client.query(countQuery, countValues);
        const totalCount = parseInt(countResult.rows[0].total, 10);

        res.json({ transactions, pagination: { currentPage: page, pageSize, totalCount } });

    } catch (error) {
        console.error('Error fetching income transactions:', error);
        res.status(500).json({ message: 'Failed to fetch transactions' });
    } finally {
        client.release();
    }
});

app.post('/withdraw', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const { amount } = req.body;

        if (!amount || amount <= 0 || isNaN(amount)) {
            return res.status(400).json({ message: 'Invalid withdrawal amount.' });
        }

        await client.query('BEGIN'); // Start transaction

        try {
            // 1. Fetch withdrawal deduction percentage
            const { rows: deductionRows } = await client.query(
                'SELECT deduction_amount FROM withdraw_deductions ORDER BY id DESC LIMIT 1'
            );

            if (deductionRows.length === 0) {
                throw new Error('Withdrawal deduction percentage not configured.');
            }

            const serviceChargeRate = parseFloat(deductionRows[0].deduction_amount);
            if (isNaN(serviceChargeRate) || serviceChargeRate < 0 || serviceChargeRate > 1) {
                throw new Error('Invalid withdrawal deduction percentage.');
            }

            const serviceCharge = amount * serviceChargeRate;
            const amountAfterCharge = amount - serviceCharge;
            const totalAmount = amount; //Only deduct the amount, service charge is handled separately


            // 2. Determine the highest active board for the user
            const { rows: userBoards } = await client.query(`
                SELECT boardtype, earnings
                FROM boards
                WHERE userid = $1 AND status = 'ACTIVE'
            `, [userId]);

            if (userBoards.length === 0) {
                throw new Error('User is not active on any board.');
            }

            const boardHierarchy = ['king', 'platinum', 'diamond', 'gold', 'silver']; //Order from highest to lowest
            const sortedBoards = userBoards.sort((a, b) => boardHierarchy.indexOf(a.boardtype) - boardHierarchy.indexOf(b.boardtype));
            const topBoard = sortedBoards[0].boardtype;
            const boardIncomeColumn = `${topBoard.toLowerCase()}_board_income`;

            // 2. Check balance in the highest active board
            const { rows: balanceRows } = await client.query(`
                SELECT ${boardIncomeColumn}, earnings FROM users u JOIN boards b ON u.user_id = b.userid WHERE u.user_id = $1 AND b.boardtype = $2 AND b.status = 'ACTIVE'
            `, [userId, topBoard]);

            const balance = parseFloat(balanceRows[0][boardIncomeColumn]);
            const boardEarnings = parseFloat(balanceRows[0].earnings); // Get board earnings

            if (isNaN(balance) || balance < amount) {
                throw new Error(`Insufficient balance in ${topBoard} board. Available balance: Rs.${balance.toFixed(2)}.`);
            }

            // 3. Deduct amount from the highest active board's income
            await client.query(
                `UPDATE users SET ${boardIncomeColumn} = ${boardIncomeColumn} - $1 WHERE user_id = $2`,
                [amount, userId]
            );

            // 4. Update board earnings
            await client.query(
                'UPDATE boards SET earnings = earnings - $1 WHERE userid = $2 AND boardtype = $3',
                [amount, userId, topBoard]
            );

            // 5. Record withdrawal transaction
            await client.query(
                `INSERT INTO wallettransactions (transactionid, fromid, amount, transactiontype, service_charge, deduction_percentage, board_type)
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
                [userId, -amount, 'WITHDRAWAL', serviceCharge, serviceChargeRate, topBoard]
            );

            await client.query('COMMIT');
            res.json({ message: `Withdrew Rs. ${amount} from income wallet successfully. (Rs. ${serviceCharge.toFixed(2)} service charge deducted)` });

        } catch (withdrawalError) {
            await client.query('ROLLBACK');
            console.error('Withdrawal error:', withdrawalError);
            res.status(500).json({ message: withdrawalError.message });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Withdrawal failed.' });
    } finally {
        client.release();
    }
});

app.get('/admin/silver-board-income', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        const silverBoardIncomeQuery = `
            SELECT 
    wt.transactionid,
    wt.transactiondate AS transaction_date, 
    wt.amount,
    u.username AS member_username,
    u.user_id AS member_id,
    f.username AS join_member_username,
    f.user_id AS join_member_id,
    wt.transactiontype AS transaction_type,
    COALESCE(
        CASE
            WHEN g.member1 = f.user_id THEN 1
            WHEN g.member2 = f.user_id THEN 2
            WHEN g.member3 = f.user_id THEN 3
            WHEN g.member4 = f.user_id THEN 4
            ELSE NULL
        END, 0) AS level,
    (SELECT COUNT(*) FROM users WHERE introducer_id = f.user_id) as total_referrals,
    f.silver_upgrade AS upgrade_amount  -- Added silver_upgrade amount
FROM wallettransactions wt
JOIN users u ON wt.fromid = u.user_id
JOIN users f ON wt.toid = f.user_id
LEFT JOIN genealogy g ON f.user_id = g.user_id
WHERE wt.transactiontype = 'SILVER_BOARD_JOIN'
  AND (LOWER(u.username) LIKE LOWER($1) OR LOWER(u.user_id) LIKE LOWER($2))
ORDER BY wt.transactiondate DESC
LIMIT $3 OFFSET $4;
        `;

        const values = [`%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const { rows: silverBoardIncomeData } = await client.query(silverBoardIncomeQuery, values);

        const totalCountQuery = `
            SELECT COUNT(*) AS total
            FROM wallettransactions wt
            JOIN users u ON wt.fromid = u.user_id
            JOIN users f ON wt.toid = f.user_id
            WHERE wt.transactiontype = 'SILVER_BOARD_JOIN'
              AND (LOWER(u.username) LIKE LOWER($1) OR LOWER(u.user_id) LIKE LOWER($2));
        `;
        const totalCountValues = [`%${searchTerm}%`, `%${searchTerm}%`];
        const { rows: totalCountResult } = await client.query(totalCountQuery, totalCountValues);
        const totalCount = parseInt(totalCountResult[0].total, 10);

        res.json({
            silverBoardIncomeData,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching silver board income:', error);
        res.status(500).json({ message: 'Failed to fetch silver board income.' });
    } finally {
        client.release();
    }
});

app.get('/admin/gold-board-income', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        const goldBoardIncomeQuery = `
            SELECT 
    wt.transactionid,
    wt.transactiondate AS transaction_date, 
    wt.amount,
    u.username AS member_username,
    u.user_id AS member_id,
    f.username AS join_member_username,
    f.user_id AS join_member_id,
    wt.transactiontype AS transaction_type,
    COALESCE(
        CASE
            WHEN g.member1 = f.user_id THEN 1
            WHEN g.member2 = f.user_id THEN 2
            WHEN g.member3 = f.user_id THEN 3
            WHEN g.member4 = f.user_id THEN 4
            ELSE NULL
        END, 0) AS level,
    (SELECT COUNT(*) FROM users WHERE introducer_id = f.user_id) as total_referrals,
    f.silver_upgrade AS upgrade_amount  -- Added silver_upgrade amount
FROM wallettransactions wt
JOIN users u ON wt.fromid = u.user_id
JOIN users f ON wt.toid = f.user_id
LEFT JOIN genealogy g ON f.user_id = g.user_id
WHERE wt.transactiontype = 'GOLD_BOARD_JOIN'
  AND (LOWER(u.username) LIKE LOWER($1) OR LOWER(u.user_id) LIKE LOWER($2))
ORDER BY wt.transactiondate DESC
LIMIT $3 OFFSET $4;
        `;

        const values = [`%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const { rows: goldBoardIncomeData } = await client.query(goldBoardIncomeQuery, values);

        const totalCountQuery = `
            SELECT COUNT(*) AS total
            FROM wallettransactions wt
            JOIN users u ON wt.fromid = u.user_id
            JOIN users f ON wt.toid = f.user_id
            WHERE wt.transactiontype = 'GOLD_BOARD_JOIN'
              AND (LOWER(u.username) LIKE LOWER($1) OR LOWER(u.user_id) LIKE LOWER($2));
        `;
        const totalCountValues = [`%${searchTerm}%`, `%${searchTerm}%`];
        const { rows: totalCountResult } = await client.query(totalCountQuery, totalCountValues);
        const totalCount = parseInt(totalCountResult[0].total, 10);

        res.json({
            goldBoardIncomeData,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching silver board income:', error);
        res.status(500).json({ message: 'Failed to fetch silver board income.' });
    } finally {
        client.release();
    }
});

app.get('/admin/diamond-board-income', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        const diamondBoardIncomeQuery = `
            SELECT 
    wt.transactionid,
    wt.transactiondate AS transaction_date, 
    wt.amount,
    u.username AS member_username,
    u.user_id AS member_id,
    f.username AS join_member_username,
    f.user_id AS join_member_id,
    wt.transactiontype AS transaction_type,
    COALESCE(
        CASE
            WHEN g.member1 = f.user_id THEN 1
            WHEN g.member2 = f.user_id THEN 2
            WHEN g.member3 = f.user_id THEN 3
            WHEN g.member4 = f.user_id THEN 4
            ELSE NULL
        END, 0) AS level,
    (SELECT COUNT(*) FROM users WHERE introducer_id = f.user_id) as total_referrals,
    f.silver_upgrade AS upgrade_amount  -- Added silver_upgrade amount
FROM wallettransactions wt
JOIN users u ON wt.fromid = u.user_id
JOIN users f ON wt.toid = f.user_id
LEFT JOIN genealogy g ON f.user_id = g.user_id
WHERE wt.transactiontype = 'DIAMOND_BOARD_JOIN'
  AND (LOWER(u.username) LIKE LOWER($1) OR LOWER(u.user_id) LIKE LOWER($2))
ORDER BY wt.transactiondate DESC
LIMIT $3 OFFSET $4;
        `;

        const values = [`%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const { rows: diamondBoardIncomeData } = await client.query(diamondBoardIncomeQuery, values);

        const totalCountQuery = `
            SELECT COUNT(*) AS total
            FROM wallettransactions wt
            JOIN users u ON wt.fromid = u.user_id
            JOIN users f ON wt.toid = f.user_id
            WHERE wt.transactiontype = 'DIAMOND_BOARD_JOIN'
              AND (LOWER(u.username) LIKE LOWER($1) OR LOWER(u.user_id) LIKE LOWER($2));
        `;
        const totalCountValues = [`%${searchTerm}%`, `%${searchTerm}%`];
        const { rows: totalCountResult } = await client.query(totalCountQuery, totalCountValues);
        const totalCount = parseInt(totalCountResult[0].total, 10);

        res.json({
            diamondBoardIncomeData,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching silver board income:', error);
        res.status(500).json({ message: 'Failed to fetch silver board income.' });
    } finally {
        client.release();
    }
});

app.get('/admin/platinum-board-income', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        const platinumBoardIncomeQuery = `
            SELECT 
    wt.transactionid,
    wt.transactiondate AS transaction_date, 
    wt.amount,
    u.username AS member_username,
    u.user_id AS member_id,
    f.username AS join_member_username,
    f.user_id AS join_member_id,
    wt.transactiontype AS transaction_type,
    COALESCE(
        CASE
            WHEN g.member1 = f.user_id THEN 1
            WHEN g.member2 = f.user_id THEN 2
            WHEN g.member3 = f.user_id THEN 3
            WHEN g.member4 = f.user_id THEN 4
            ELSE NULL
        END, 0) AS level,
    (SELECT COUNT(*) FROM users WHERE introducer_id = f.user_id) as total_referrals,
    f.silver_upgrade AS upgrade_amount  -- Added silver_upgrade amount
FROM wallettransactions wt
JOIN users u ON wt.fromid = u.user_id
JOIN users f ON wt.toid = f.user_id
LEFT JOIN genealogy g ON f.user_id = g.user_id
WHERE wt.transactiontype = 'PLATINUM_BOARD_JOIN'
  AND (LOWER(u.username) LIKE LOWER($1) OR LOWER(u.user_id) LIKE LOWER($2))
ORDER BY wt.transactiondate DESC
LIMIT $3 OFFSET $4;
        `;

        const values = [`%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const { rows: platinumBoardIncomeData } = await client.query(platinumBoardIncomeQuery, values);

        const totalCountQuery = `
            SELECT COUNT(*) AS total
            FROM wallettransactions wt
            JOIN users u ON wt.fromid = u.user_id
            JOIN users f ON wt.toid = f.user_id
            WHERE wt.transactiontype = 'PLATINUM_BOARD_JOIN'
              AND (LOWER(u.username) LIKE LOWER($1) OR LOWER(u.user_id) LIKE LOWER($2));
        `;
        const totalCountValues = [`%${searchTerm}%`, `%${searchTerm}%`];
        const { rows: totalCountResult } = await client.query(totalCountQuery, totalCountValues);
        const totalCount = parseInt(totalCountResult[0].total, 10);

        res.json({
            platinumBoardIncomeData,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching silver board income:', error);
        res.status(500).json({ message: 'Failed to fetch silver board income.' });
    } finally {
        client.release();
    }
});


app.get('/admin/king-board-income', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        const kingBoardIncomeQuery = `
            SELECT 
    wt.transactionid,
    wt.transactiondate AS transaction_date, 
    wt.amount,
    u.username AS member_username,
    u.user_id AS member_id,
    f.username AS join_member_username,
    f.user_id AS join_member_id,
    wt.transactiontype AS transaction_type,
    COALESCE(
        CASE
            WHEN g.member1 = f.user_id THEN 1
            WHEN g.member2 = f.user_id THEN 2
            WHEN g.member3 = f.user_id THEN 3
            WHEN g.member4 = f.user_id THEN 4
            ELSE NULL
        END, 0) AS level,
    (SELECT COUNT(*) FROM users WHERE introducer_id = f.user_id) as total_referrals,
    f.silver_upgrade AS upgrade_amount  -- Added silver_upgrade amount
FROM wallettransactions wt
JOIN users u ON wt.fromid = u.user_id
JOIN users f ON wt.toid = f.user_id
LEFT JOIN genealogy g ON f.user_id = g.user_id
WHERE wt.transactiontype = 'KING_BOARD_JOIN'
  AND (LOWER(u.username) LIKE LOWER($1) OR LOWER(u.user_id) LIKE LOWER($2))
ORDER BY wt.transactiondate DESC
LIMIT $3 OFFSET $4;
        `;

        const values = [`%${searchTerm}%`, `%${searchTerm}%`, pageSize, offset];
        const { rows: kingBoardIncomeData } = await client.query(kingBoardIncomeQuery, values);

        const totalCountQuery = `
            SELECT COUNT(*) AS total
            FROM wallettransactions wt
            JOIN users u ON wt.fromid = u.user_id
            JOIN users f ON wt.toid = f.user_id
            WHERE wt.transactiontype = 'KING_BOARD_JOIN'
              AND (LOWER(u.username) LIKE LOWER($1) OR LOWER(u.user_id) LIKE LOWER($2));
        `;
        const totalCountValues = [`%${searchTerm}%`, `%${searchTerm}%`];
        const { rows: totalCountResult } = await client.query(totalCountQuery, totalCountValues);
        const totalCount = parseInt(totalCountResult[0].total, 10);

        res.json({
            kingBoardIncomeData,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching silver board income:', error);
        res.status(500).json({ message: 'Failed to fetch silver board income.' });
    } finally {
        client.release();
    }
});

app.get('/memberList', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        let whereClause = '';
        let queryParams = [];
        let paramIndex = 1;

        if (searchTerm) {
            whereClause = `WHERE LOWER(username) LIKE LOWER($${paramIndex++}) OR LOWER(user_id) LIKE LOWER($${paramIndex++})`;
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        const query = `
            SELECT 
                COUNT(*) OVER () AS total_count,  -- Add total count for pagination
                user_id, 
                username, 
                introducer_id, 
                (SELECT COUNT(*) FROM users WHERE introducer_id = users.user_id) as referral_count,
                mobile, 
                password, 
                transaction_password, 
                status, 
                country, 
                email, 
                created_at,
                lock_status,
                withdrawal_lock_status
            FROM users
            ${whereClause}
            ORDER BY id ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
        `;
        queryParams.push(pageSize, offset); // Add pagination parameters


        const result = await client.query(query, queryParams);
        const totalCount = result.rows.length > 0 ? result.rows[0].total_count : 0; //Get total count

        const paginatedMembers = result.rows.map(member => {
            delete member.total_count; //Remove total count before sending
            return member;
        });

        res.json({ members: paginatedMembers, totalCount, currentPage: page, pageSize });
    } catch (error) {
        console.error('Error fetching member list:', error);
        res.status(500).json({ message: 'Failed to fetch member list' });
    } finally {
        client.release();
    }
});

// Route to lock/unlock user account
app.put('/lock-account/:userId', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.params.userId;

        // Fetch the current lock status
        const { rows } = await client.query('SELECT lock_status FROM users WHERE user_id = $1', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const currentLockStatus = rows[0].lock_status;

        // Toggle the lock status (true becomes false, false becomes true)
        const newLockStatus = !currentLockStatus;

        // Update the user's lock status
        const result = await client.query(
            'UPDATE users SET lock_status = $1 WHERE user_id = $2',
            [newLockStatus, userId]
        );

        if (result.rowCount === 1) {
            res.json({ message: `Account lock status for user ${userId} updated to ${newLockStatus}.` });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error locking/unlocking account:', error);
        res.status(500).json({ message: 'Failed to update account lock status.' });
    } finally {
        client.release();
    }
});

// Route to lock/unlock user withdrawal
app.put('/lock-withdrawal/:userId', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.params.userId;

        // Fetch the current withdrawal lock status
        const { rows } = await client.query(
            'SELECT withdrawal_lock_status FROM users WHERE user_id = $1',
            [userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const currentWithdrawalLockStatus = rows[0].withdrawal_lock_status;

        // Toggle the withdrawal lock status
        const newWithdrawalLockStatus = !currentWithdrawalLockStatus;

        // Update the user's withdrawal lock status
        const result = await client.query(
            'UPDATE users SET withdrawal_lock_status = $1 WHERE user_id = $2',
            [newWithdrawalLockStatus, userId]
        );

        if (result.rowCount === 1) {
            res.json({
                message: `Withdrawal lock status for user ${userId} updated to ${newWithdrawalLockStatus}.`
            });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error locking/unlocking withdrawal:', error);
        res.status(500).json({ message: 'Failed to update withdrawal lock status.' });
    } finally {
        client.release();
    }
});

app.put('/users/:userId', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.params.userId;
        const updatedData = sanitizeAndValidateUserData(req.body);

        if (updatedData.error) {
            return res.status(400).json({ message: updatedData.error });
        }

        // Check for empty data after sanitization and validation
        if (Object.keys(updatedData).length === 0) {
            return res.status(400).json({ message: 'No data to update.' });
        }

        const updateFields = [];
        const updateValues = [];
        for (const key in updatedData) {
            if (updatedData.hasOwnProperty(key)) {
                updateFields.push(`${key} = $${updateValues.length + 1}`);
                updateValues.push(updatedData[key]);
            }
        }

        updateValues.push(userId); // Add userId as the last parameter
        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = $${updateValues.length}`;
        console.log(updateQuery)
        console.log(updateValues)

        await client.query(updateQuery, updateValues);
        res.json({ message: 'User details updated successfully' });

    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).json({ message: 'Failed to update user details.' });
    } finally {
        client.release();
    }
});

app.get('/users/:userId', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.params.userId;

        // Fetch user details.  Select only the necessary columns for security and efficiency.
        const { rows } = await client.query(
            'SELECT user_id, username, email, mobile, address, street, city, state, country, zipcode, aadhaar_number, pan_number,fund_income,rebirth_balance,silver_board_income,gold_board_income,diamond_board_income,platinum_board_income,king_board_income,lock_status FROM users WHERE user_id = $1',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(rows[0]); // Send the user data as JSON
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Failed to fetch user details.' });
    } finally {
        client.release();
    }
});

app.get('/referrer-link', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const { rows } = await client.query('SELECT user_id FROM users WHERE user_id = $1', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const referrerLink = `https://aghan-user.netlify.app/register?introducerId=${userId}`;
        res.json({ referrerLink });
    } catch (error) {
        console.error('Error generating referrer link:', error);
        res.status(500).json({ message: 'Failed to generate referrer link.' });
    } finally {
        client.release();
    }
});

app.get('/transaction/withdrawal', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;

        // Query to calculate the total withdrawal amount
        const result = await client.query(`
            SELECT 
    ABS(SUM(amount)) AS total_withdrawal_amount
FROM wallettransactions
WHERE transactiontype = 'WITHDRAWAL' AND fromid = $1
        `, [userId]);

        if (result.rows.length === 0) {
            // Return 0 if no withdrawals found
            return res.json({ total_withdrawal_amount: 0 });
        }

        // Access and return the total withdrawal amount
        const totalWithdrawalAmount = parseFloat(result.rows[0].total_withdrawal_amount);
        res.json({ total_withdrawal_amount: totalWithdrawalAmount });

    } catch (error) {
        console.error('Error fetching total withdrawal amount:', error);
        res.status(500).json({ message: 'Failed to fetch total withdrawal amount.' });
    } finally {
        client.release();
    }
});

app.post('/profile-image-upload', authenticateToken, upload.single('profile_image'), async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;

        // Input validation
        if (!req.file) {
            return res.status(400).json({ error: 'No profile image uploaded.' });
        }

        const fileUrl = `/uploads/${req.file.filename}`; // Save the relative file path

        // Update the user's profile_image URL in the database
        await client.query(
            'UPDATE users SET profile_image = $1 WHERE user_id = $2',
            [fileUrl, userId]
        );

        res.json({ message: 'Profile image uploaded successfully!', imageUrl: fileUrl });
    } catch (error) {
        console.error('Error saving profile image:', error);
        res.status(500).json({ error: 'Failed to save profile image.' });
    } finally {
        client.release();
    }
});

app.post('/bank-details', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const { account_holder_name, account_number, bank_name, bank_ifsc, bank_branch } = req.body;

        // Input validation
        if (!account_holder_name || !account_number || !bank_name || !bank_ifsc || !bank_branch) {
            return res.status(400).json({ error: 'All fields are required.' });
        }


        await client.query('BEGIN'); // Start transaction
        try {
            // Check if a bank record for this user already exists
            const checkResult = await client.query(
                'SELECT account_id FROM banks WHERE user_id = $1',
                [userId]
            );

            if (checkResult.rows.length > 0) {
                // Update existing bank details
                await client.query(
                    'UPDATE banks SET account_holder_name = $1, account_number = $2, bank_name = $3, bank_ifsc = $4, bank_branch = $5 WHERE user_id = $6',
                    [account_holder_name, account_number, bank_name, bank_ifsc, bank_branch, userId]
                );
                console.log(`Bank details updated for user ${userId}`);
                res.json({ message: 'Bank details updated successfully.' });
            } else {
                // Insert new bank details
                //Generate UUID using PostgreSQL's uuid_generate_v4()
                const newAccountId = uuidv4();
                await client.query(
                    'INSERT INTO banks (account_id, user_id, account_holder_name, account_number, bank_name, bank_ifsc, bank_branch) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [newAccountId, userId, account_holder_name, account_number, bank_name, bank_ifsc, bank_branch]
                );
                console.log(`Bank details inserted for user ${userId}`);
                res.json({ message: 'Bank details saved successfully.' });
            }

            await client.query('COMMIT'); // Commit the transaction
        } catch (updateError) {
            await client.query('ROLLBACK'); // Rollback if error
            console.error('Error updating or inserting bank details:', updateError);
            res.status(500).json({ error: 'Failed to save bank details.' });
        }

    } catch (error) {
        console.error('Error processing bank details:', error);
        res.status(500).json({ error: 'Failed to process bank details.' });
    } finally {
        client.release();
    }
});

app.get('/bank-details', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;

        // Query to fetch bank details for the authenticated user
        const result = await client.query(
            'SELECT * FROM banks WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            // Handle case where no bank details are found
            return res.json({ bank_details: false, message: 'No bank details found for this user. Please Select and insert the bank details.' });  //More user-friendly message
        }

        // Return the bank details
        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error fetching bank details:', error);
        res.status(500).json({ error: 'Failed to fetch bank details.' });
    } finally {
        client.release();
    }
});


app.post('/upi-details', authenticateToken, upload.single('upi_image'), async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId; // Get userId from authentication middleware
        const { upi_address, googlepay, phonpe, paytm } = req.body;


        // Input validation (add more robust validation as needed)
        if (!upi_address || upi_address.trim() === "") {
            return res.status(400).json({ error: 'UPI address is required.' });
        }

        await client.query('BEGIN');
        try {
            const checkResult = await client.query(
                'SELECT upi_id FROM upis WHERE user_id = $1',
                [userId]
            );

            let imageUrl = null;
            if (req.file) {
                imageUrl = `/uploads/${req.file.filename}`; // Save the relative file path
            }
            if (checkResult.rows.length > 0) {
                const updateQuery = `UPDATE upis SET upi_address = $1, googlepay = $2, phonpe = $3, paytm = $4, image_name = $5 WHERE user_id = $6`;
                const updateValues = [upi_address, googlepay, phonpe, paytm, imageUrl, userId];
                await client.query(updateQuery, updateValues);
                console.log(`UPI details updated for user ${userId}`);
                res.json({ message: 'UPI details updated successfully.' });
            } else {
                const newUpiId = uuidv4();
                const insertQuery = `INSERT INTO upis (upi_id, user_id, upi_address, googlepay, phonpe, paytm, image_name) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
                const insertValues = [newUpiId, userId, upi_address, googlepay, phonpe, paytm, imageUrl];
                await client.query(insertQuery, insertValues);
                console.log(`UPI details inserted for user ${userId}`);
                res.json({ message: 'UPI details saved successfully.' });
            }
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to save UPI details.' });
        }
    } catch (error) {
        console.error('Error processing UPI details:', error);
        res.status(500).json({ error: 'Failed to process UPI details.' });
    } finally {
        client.release();
    }
});


//GET route for fetching UPI details
app.get('/upi-details', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const result = await client.query(
            'SELECT * FROM upis WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({ message: 'No UPI details found for this user.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching UPI details:', error);
        res.status(500).json({ error: 'Failed to fetch UPI details.' });
    } finally {
        client.release();
    }
});

async function checkBonusEligibility(userId, rebirthId) {
    const client = await pgPool.connect();
    try {
        // Check if user exists
        const userExistsResult = await client.query('SELECT 1 FROM users WHERE user_id = $1', [userId]);
        if (userExistsResult.rows.length === 0) {
            return false; // User not found
        }

        // Check for 6 direct referrals and 36 descendants (level 2)  using memberN columns
        const { level1Count, level2Count } = await countReferralsFromMemberN(rebirthId, client);

        if (level1Count < 6 || level2Count < 36) {
            return false; // Referral count conditions not met
        }

        // Check rebirth status (only process if pending)
        const { rows: rebirthRows } = await client.query(
            'SELECT status FROM rebirths WHERE rebirth_id = $1',
            [rebirthId]
        );

        if (!rebirthRows.length || rebirthRows[0].status !== 'pending') {
            return false; // Rebirth already claimed or invalid rebirthId
        }

        return true; // Eligibility conditions met
    } catch (error) {
        console.error('Error checking bonus eligibility:', error);
        return false;
    } finally {
        client.release();
    }
}
async function countReferralsFromMemberN(rebirthId, client) {
    const { rows: rebirthUser } = await client.query(
        'SELECT user_id FROM rebirths WHERE rebirth_id = $1',
        [rebirthId]
    );
    if (!rebirthUser || rebirthUser.length === 0) {
        return { level1Count: 0, level2Count: 0 };
    }
    const memberUserId = rebirthUser[0].user_id;


    const { rows: level1Data } = await client.query(`
        SELECT member1, member2, member3, member4
        FROM genealogy
        WHERE user_id = $1
    `, [memberUserId]);

    if (!level1Data || level1Data.length === 0) {
        return { level1Count: 0, level2Count: 0 };
    }

    const level1Referrals = Object.values(level1Data[0]).filter(id => id !== null);
    const level1Count = level1Referrals.length;


    let level2Count = 0;
    if (level1Referrals.length > 0) {
        const level2Query = `
            SELECT COUNT(*) as count
            FROM genealogy
            WHERE user_id IN (${level1Referrals.map(id => client.escapeLiteral(id)).join(',')})
              AND (member1 IS NOT NULL OR member2 IS NOT NULL OR member3 IS NOT NULL OR member4 IS NOT NULL);
        `;
        const { rows: level2Result } = await client.query(level2Query);
        level2Count = parseInt(level2Result[0].count, 10);
    }


    return { level1Count, level2Count };
}

app.get('/achievers', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        // Fetch all achievers from the achieved_users table
        const { rows: achievers } = await client.query(
            'SELECT au.user_id, u.username, au.level1_count, au.level2_count, au.status, au.achieved_at FROM achieved_users au JOIN users u ON au.user_id = u.user_id'
        );

        res.json({ achievers });
    } catch (error) {
        console.error('Error fetching achievers:', error);
        res.status(500).json({ message: 'Failed to fetch achievers.' });
    } finally {
        client.release();
    }
});

app.get('/users/achievers', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;


        const baseQuery = `
            SELECT au.user_id, u.username, au.level1_count, au.level2_count, au.status, au.achieved_at
            FROM achieved_users au
            JOIN users u ON au.user_id = u.user_id
        `;
        let query = baseQuery;
        const params = [];

        if (searchTerm) {
            query += ` WHERE LOWER(u.username) LIKE LOWER($1)`;
            params.push(`%${searchTerm}%`);
        }

        const countQuery = `${baseQuery.substring(0, baseQuery.indexOf('FROM'))} COUNT(*) AS total FROM ${baseQuery.substring(baseQuery.indexOf('FROM'))}`;
        const countResult = await client.query(countQuery, params);
        const totalCount = countResult.rows[0].total;


        query += ` ORDER BY au.achieved_at DESC LIMIT $2 OFFSET $3`;
        params.push(pageSize, offset);

        const { rows: achievers } = await client.query(query, params);

        res.json({ achievers, totalCount });  //Return totalCount as well

    } catch (error) {
        console.error('Error fetching achievers:', error);
        res.status(500).json({ message: 'Failed to fetch achievers.' });
    } finally {
        client.release();
    }
});

app.get('/genealogy/:userId/:level', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.params.userId;
        const level = parseInt(req.params.level, 10); // Get the level from the URL parameter

        if (isNaN(level) || level < 1 || level > 4) {
            return res.status(400).json({ message: 'Invalid level. Level must be between 1 and 4.' });
        }

        // Dynamically construct the query based on the requested level
        const query = `
            SELECT member${level} AS memberId
            FROM genealogy
            WHERE user_id = $1;
        `;

        const { rows } = await client.query(query, [userId]);

        // Extract the memberId, handling cases where memberId might be null
        const memberIds = rows.map(row => row.memberId).filter(id => id !== null);

        res.json({ memberIds }); // Return the array of member IDs at the specified level

    } catch (error) {
        console.error('Error fetching genealogy members:', error);
        res.status(500).json({ message: 'Failed to fetch genealogy members.' });
    } finally {
        client.release();
    }
});

app.get('/withdraw-deduction', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const { rows } = await client.query(
            'SELECT deduction_amount FROM withdraw_deductions ORDER BY id DESC LIMIT 1'
        );

        if (rows.length === 0) {
            return res.status(200).json({ deduction_amount: 0, message: 'No deduction amount found. Please set a deduction amount.' }); // Handle no deduction yet
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching withdrawal deduction:', error);
        res.status(500).json({ message: 'Failed to fetch withdrawal deduction.' });
    } finally {
        client.release();
    }
});


// Route to UPDATE/SET the withdrawal deduction
app.put('/withdraw-deduction', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const { deduction_amount } = req.body;

        // Input validation
        if (deduction_amount === undefined || isNaN(parseFloat(deduction_amount)) || parseFloat(deduction_amount) < 0 || parseFloat(deduction_amount) > 1) {
            return res.status(400).json({ error: 'Invalid deduction amount.  Must be a number between 0 and 1 (inclusive).' });
        }

        await client.query('BEGIN'); // Start transaction

        try {
            // Check if any withdrawal deduction exists and update if found, otherwise insert a new one.
            const checkResult = await client.query(
                'SELECT id FROM withdraw_deductions ORDER BY id DESC LIMIT 1'
            );

            if (checkResult.rows.length > 0) {
                // Update existing withdrawal deduction
                await client.query(
                    'UPDATE withdraw_deductions SET deduction_amount = $1 WHERE id = $2',
                    [deduction_amount, checkResult.rows[0].id]
                );
                console.log(`Withdrawal deduction updated to ${deduction_amount}`);
                res.json({ message: 'Withdrawal deduction updated successfully.' });
            } else {
                // Insert new withdrawal deduction record
                await client.query(
                    'INSERT INTO withdraw_deductions (deduction_amount) VALUES ($1)',
                    [deduction_amount]
                );
                console.log(`Withdrawal deduction set to ${deduction_amount}`);
                res.json({ message: 'Withdrawal deduction set successfully.' });
            }

            await client.query('COMMIT');
        } catch (updateError) {
            await client.query('ROLLBACK');
            console.error('Error updating or inserting withdrawal deduction:', updateError);
            res.status(500).json({ error: 'Failed to save withdrawal deduction.' });
        }

    } catch (error) {
        console.error('Error processing withdrawal deduction:', error);
        res.status(500).json({ error: 'Failed to process withdrawal deduction.' });
    } finally {
        client.release();
    }
});

app.put('/update-profile/:userId', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.params.userId;
        const { username, email, mobile, aadhaar_number, pan_number } = req.body;
        console.log(req.body)
        // Input validation (Add more robust validation as needed)
        if (!username || !email || !mobile) {
            return res.status(400).json({ error: 'Full name, email, and phone number are required.' });
        }

        // Email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email address format.' });
        }

        // Phone number validation (adapt to your format)
        if (!/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ error: 'Invalid phone number format.' });
        }

        await client.query('BEGIN'); // Start transaction

        try {
            await client.query(
                `UPDATE users 
                 SET username = $1, email = $2, mobile = $3, aadhaar_number = $4, pan_number = $5
                 WHERE user_id = $6`,
                [username, email, mobile, aadhaar_number, pan_number, userId]
            );
            await client.query('COMMIT');
            res.json({ message: 'User profile updated successfully.' });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating user profile:', error);
            //Handle specific error codes (e.g., unique constraint violation for email)
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Email already exists.' });
            }
            res.status(500).json({ error: 'Failed to update user profile.' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update user profile.' });
    }
});



// Route to update user address information
app.put('/update-address/:userId', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.params.userId;
        const { address, street, city, state, country, pincode } = req.body;

        // Input validation (Add more robust validation as needed)
        if (!address || !street || !city || !state || !country || !pincode) {
            return res.status(400).json({ error: 'All address fields are required.' });
        }

        await client.query('BEGIN');
        try {
            await client.query(
                `UPDATE users 
                 SET address = $1, street = $2, city = $3, state = $4, country = $5, zipcode = $6
                 WHERE user_id = $7`,
                [address, street, city, state, country, pincode, userId]
            );

            await client.query('COMMIT');
            res.json({ message: 'User address updated successfully.' });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating user address:', error);
            res.status(500).json({ error: 'Failed to update user address.' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating user address:', error);
        res.status(500).json({ error: 'Failed to update user address.' });
    }
});

app.put('/update-password/:userId', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.params.userId;
        const { newPassword, confirmPassword, newTransactionPassword, confirmTransactionPassword } = req.body;

        // Input validation
        if (!newPassword || !confirmPassword || newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'New passwords do not match.' });
        }
        if (newTransactionPassword && confirmTransactionPassword && newTransactionPassword !== confirmTransactionPassword) {
            return res.status(400).json({ error: 'New transaction passwords do not match.' });
        }

        await client.query('BEGIN'); // Start transaction

        try {
            let updateQuery = 'UPDATE users SET ';
            const updateValues = [];
            let valueIndex = 1;

            if (newPassword) {
                updateQuery += `password = $${valueIndex++}, `;
                updateValues.push(newPassword);
            }
            if (newTransactionPassword) {
                updateQuery += `transaction_password = $${valueIndex++}, `;
                updateValues.push(newTransactionPassword);
            }
            // Remove trailing comma and space if necessary
            if (updateQuery.endsWith(', ')) {
                updateQuery = updateQuery.slice(0, -2);
            }

            if (updateQuery === 'UPDATE users SET ') { //Nothing to update
                return res.status(400).json({ error: 'No password to update.' });
            }

            updateQuery += ` WHERE user_id = $${valueIndex}`;
            updateValues.push(userId);

            await client.query(updateQuery, updateValues);
            await client.query('COMMIT');
            res.json({ message: 'User password(s) updated successfully.' });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating user password:', error);
            res.status(500).json({ error: 'Failed to update user password(s).' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating user password:', error);
        res.status(500).json({ error: 'Failed to update user password(s).' });
    }
});

app.get('/bank-details/:userId', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.params.userId;

        const { rows } = await client.query(
            'SELECT * FROM banks WHERE user_id = $1',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(200).json({ bank_details: null, message: 'No bank details found for this user.' }); //More user-friendly message
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching bank details:', error);
        res.status(500).json({ error: 'Failed to fetch bank details.' });
    } finally {
        client.release();
    }
});

// Route to update bank details for a specific user
app.put('/bank-details/:userId', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.params.userId;
        const { account_holder_name, account_number, bank_name, bank_ifsc, bank_branch } = req.body;

        // Input validation
        if (!account_holder_name || !account_number || !bank_name || !bank_ifsc || !bank_branch) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        await client.query('BEGIN');
        try {
            // Check if a bank record for this user already exists. Update or insert
            const checkResult = await client.query(
                'SELECT account_id FROM banks WHERE user_id = $1',
                [userId]
            );

            if (checkResult.rows.length > 0) {
                // Update existing bank details
                await client.query(
                    'UPDATE banks SET account_holder_name = $1, account_number = $2, bank_name = $3, bank_ifsc = $4, bank_branch = $5 WHERE user_id = $6',
                    [account_holder_name, account_number, bank_name, bank_ifsc, bank_branch, userId]
                );
                console.log(`Bank details updated for user ${userId}`);
                res.json({ message: 'Bank details updated successfully.' });
            } else {
                // Insert new bank details
                const newAccountId = uuidv4();
                await client.query(
                    'INSERT INTO banks (account_id, user_id, account_holder_name, account_number, bank_name, bank_ifsc, bank_branch) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [newAccountId, userId, account_holder_name, account_number, bank_name, bank_ifsc, bank_branch]
                );
                console.log(`Bank details inserted for user ${userId}`);
                res.json({ message: 'Bank details saved successfully.' });
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating or inserting bank details:', error);
            // Handle specific error codes (e.g., unique constraint violation)
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Account number or bank IFSC already exists.' });
            }
            res.status(500).json({ error: 'Failed to save bank details.' });
        }
    } catch (error) {
        console.error('Error processing bank details:', error);
        res.status(500).json({ error: 'Failed to process bank details.' });
    } finally {
        client.release();
    }
});

app.get('/upi-details/:userId', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.params.userId;

        const { rows } = await client.query(
            'SELECT * FROM upis WHERE user_id = $1',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(200).json({ upi_details: null, message: 'No UPI details found for this user.' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching UPI details:', error);
        res.status(500).json({ error: 'Failed to fetch UPI details.' });
    } finally {
        client.release();
    }
});

app.put('/upi-details/:userId', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.params.userId;
        const { googlepay, phonpe, paytm } = req.body; // Only these fields are required now

        // Input validation (More robust validation is recommended for production)
        const phoneRegex = /^\d{10}$/; // Adjust regex as needed for your phone number format
        if (googlepay && !phoneRegex.test(googlepay)) {
            return res.status(400).json({ error: 'Invalid Google Pay number.' });
        }
        if (phonpe && !phoneRegex.test(phonpe)) {
            return res.status(400).json({ error: 'Invalid PhonePe number.' });
        }
        if (paytm && !phoneRegex.test(paytm)) {
            return res.status(400).json({ error: 'Invalid PayTM number.' });
        }

        await client.query('BEGIN'); // Start transaction
        try {
            // Check if UPI details exist for the user; update or insert
            const checkResult = await client.query(
                'SELECT upi_id FROM upis WHERE user_id = $1',
                [userId]
            );

            if (checkResult.rows.length > 0) {
                // Update existing UPI details (only if values are provided)
                let updateQuery = 'UPDATE upis SET ';
                const updateValues = [];
                let valueIndex = 1;

                if (googlepay) {
                    updateQuery += `googlepay = $${valueIndex++}, `;
                    updateValues.push(googlepay);
                }
                if (phonpe) {
                    updateQuery += `phonpe = $${valueIndex++}, `;
                    updateValues.push(phonpe);
                }
                if (paytm) {
                    updateQuery += `paytm = $${valueIndex++}, `;
                    updateValues.push(paytm);
                }

                if (updateQuery === 'UPDATE upis SET ') { //Nothing to update
                    return res.status(200).json({ message: 'No UPI details to update' });
                }

                updateQuery = updateQuery.substring(0, updateQuery.length - 2); // Remove trailing comma and space
                updateQuery += ` WHERE user_id = $${valueIndex}`;
                updateValues.push(userId);

                await client.query(updateQuery, updateValues);
                console.log(`UPI details updated for user ${userId}`);
                res.json({ message: 'UPI details updated successfully.' });
            } else {
                // Insert new UPI details (only if at least one value provided)
                if (!googlepay && !phonpe && !paytm) {
                    return res.status(400).json({ error: 'At least one UPI number is required.' });
                }
                const newUpiId = uuidv4();
                await client.query(
                    `INSERT INTO upis (upi_id, user_id, googlepay, phonpe, paytm) VALUES ($1, $2, $3, $4, $5)`,
                    [newUpiId, userId, googlepay, phonpe, paytm]
                );
                console.log(`UPI details inserted for user ${userId}`);
                res.json({ message: 'UPI details saved successfully.' });
            }

            await client.query('COMMIT'); // Commit the transaction
        } catch (error) {
            await client.query('ROLLBACK'); // Rollback on error
            console.error('Error updating or inserting UPI details:', error);
            res.status(500).json({ error: 'Failed to save UPI details.' });
        }
    } catch (error) {
        console.error('Error processing UPI details:', error);
        res.status(500).json({ error: 'Failed to process UPI details.' });
    } finally {
        client.release();
    }
});

app.get('/filteredMemberList', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || '';
        const fromDate = req.query.fromDate || '';
        const toDate = req.query.toDate || '';
        const offset = (page - 1) * pageSize;

        let whereClause = 'WHERE'; // Base condition
        const queryParams = [];
        let paramIndex = 1;

        if (searchTerm) {
            whereClause += ` (LOWER(username) LIKE LOWER($${paramIndex++}) OR LOWER(user_id) LIKE LOWER($${paramIndex++}))`;
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        if (fromDate) {
            whereClause += ` AND created_at >= $${paramIndex++}`;
            queryParams.push(fromDate);
        }

        if (toDate) {
            whereClause += ` AND created_at <= $${paramIndex++}`;
            queryParams.push(toDate);
        }

        //Main Query
        const query = `
            SELECT 
                COUNT(*) OVER () AS total_count,
                user_id, 
                username, 
                introducer_id, 
                (SELECT COUNT(*) FROM users WHERE introducer_id = users.user_id) as referral_count,
                mobile, 
                password, 
                transaction_password, 
                status, 
                country, 
                email, 
                created_at,
                lock_status,
                withdrawal_lock_status
            FROM users
            ${whereClause}
            ORDER BY id ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
        `;
        queryParams.push(pageSize, offset);

        const { rows } = await client.query(query, queryParams);
        const totalCount = rows.length > 0 ? rows[0].total_count : 0;
        const paginatedMembers = rows.map(member => {
            delete member.total_count;
            return member;
        });

        res.json({ members: paginatedMembers, totalCount, currentPage: page, pageSize });

    } catch (error) {
        console.error('Error fetching filtered member list:', error);
        res.status(500).json({ message: 'Failed to fetch filtered member list.' });
    } finally {
        client.release();
    }
});
app.get('/download/excel', authenticateToken, async (req, res) => {
    try {
        const { data } = await fetch(`http://localhost:5000/filteredMemberList?${createQueryString(req.query)}`, {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        const members = data.members;
        console.log(members)
        const worksheetData = members.map((member, index) => ({
            'S.NO': index + 1,
            'Member': member.username,
            'Email': member.email,
            'Mobile': member.mobile,
            'Pass': member.password,
            'S.Pass': member.transaction_password,
            'Status': member.status,
            'Referral': member.introducer_id,
            'Date of Join': member.created_at
        }));

        const worksheet = xlsx.utils.json_to_sheet(worksheetData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Members');
        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=aghan_members.xlsx');
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('Error generating Excel file');
    }
});
app.get('/download/pdf', authenticateToken, async (req, res) => {
    try {
        const response = await fetch(`http://localhost:5000/filteredMemberList?${createQueryString(req.query)}`, {
            headers: {
                'Authorization': req.headers.authorization
            }
        });
        console.log(response)
        const members = response.data.members;
        console.log(members)
        const doc = new jsPDF();
        doc.setFontSize(12);
        doc.text('Member List', 10, 10);
        doc.autoTable({
            head: [['S.NO', 'Member', 'Email', 'Mobile', 'Pass', 'S.Pass', 'Status', 'Referral', 'Date of Join']],
            body: members.map((member, index) => [index + 1, member.username, member.email, member.mobile, member.password, member.transaction_password, member.status, member.introducer_id, member.created_at]),
            columnStyles: {
                'Date of Join': {
                    halign: 'center'
                }
            }
        });

        const pdfBuffer = doc.output('blob');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=members.pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF file');
    }
});

//Helper Function
function createQueryString(query) {
    let queryString = '';
    if (query.fromDate) queryString += `fromDate=${query.fromDate}&`;
    if (query.toDate) queryString += `toDate=${query.toDate}&`;
    if (query.search) queryString += `search=${query.search}&`;
    return queryString.slice(0, -1);
}

app.get('/payout', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;
        const searchTerm = req.query.search || "";

        let query = `SELECT * FROM payout_table WHERE user_id = $1`;
        const queryParams = [userId];

        if (searchTerm) {
            query += ` AND (member ILIKE $${queryParams.length + 1} OR mobile ILIKE $${queryParams.length + 2} OR amount::text ILIKE $${queryParams.length + 3})`;
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`); // Use ILIKE for case-insensitive search
        }

        query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(pageSize, offset);

        const { rows: payouts } = await client.query(query, queryParams);

        let countQuery = `SELECT COUNT(*) AS total FROM payout_table WHERE user_id = $1`;
        const countQueryParams = [userId];
        if (searchTerm) {
            countQuery += ` AND (member ILIKE $${countQueryParams.length + 1} OR mobile ILIKE $${countQueryParams.length + 2} OR amount::text ILIKE $${countQueryParams.length + 3})`;
            countQueryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
        }
        const { rows: countResult } = await client.query(countQuery, countQueryParams);
        const totalCount = parseInt(countResult[0].total, 10);

        res.json({ payout: payouts, pagination: { currentPage: page, pageSize, totalCount } });
    } catch (error) {
        console.error('Error fetching payout data:', error);
        res.status(500).json({ message: 'Failed to fetch payout data', error: error.detail }); // Include error details
    } finally {
        client.release();
    }
});

app.get('/paidIncome', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;
        const searchTerm = req.query.search || '';

        let query = `SELECT * FROM payout_table WHERE user_id = $1 AND status='Paid'`; // Assuming paid_income table
        const queryParams = [userId];

        if (searchTerm) {
            query += ` AND (member ILIKE $${queryParams.length + 1})`; // Adjust column names as needed
            queryParams.push(`%${searchTerm}%`);
        }

        query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(pageSize, offset);

        const result = await client.query(query, queryParams);
        const payouts = result.rows;

        const countQuery = `SELECT COUNT(*) AS total FROM payout_table WHERE user_id = $1 AND status='Paid' ${searchTerm ? `AND (member ILIKE $2)` : ''}`;
        const countQueryParams = searchTerm ? [userId, `%${searchTerm}%`] : [userId];
        const countResult = await client.query(countQuery, countQueryParams);
        const totalCount = parseInt(countResult.rows[0].total, 10);

        res.json({ paidIncome: payouts, pagination: { currentPage: page, pageSize, totalCount } });
    } catch (error) {
        console.error('Error fetching paid income data:', error);
        res.status(500).json({ message: 'Failed to fetch paid income data', error: error.detail });
    } finally {
        client.release();
    }
});

app.get('/unpaidIncome', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;
        const searchTerm = req.query.search || '';

        let query = `SELECT * FROM payout_table WHERE user_id = $1 AND status = 'Pending'`;
        const queryParams = [userId];

        if (searchTerm) {
            query += ` AND (member ILIKE $${queryParams.length + 1} OR mobile ILIKE $${queryParams.length + 2} OR amount::text ILIKE $${queryParams.length + 3})`;
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
        }

        query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(pageSize, offset);

        const { rows: unpaidIncomes } = await client.query(query, queryParams);

        const countQuery = `SELECT COUNT(*) AS total FROM payout_table WHERE user_id = $1 AND status = 'Pending' ${searchTerm ? `AND (member ILIKE $2 OR mobile ILIKE $3 OR amount::text ILIKE $4)` : ''}`;
        const countQueryParams = searchTerm ? [userId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`] : [userId];
        const { rows: countResult } = await client.query(countQuery, countQueryParams);
        const totalCount = parseInt(countResult[0].total, 10);

        res.json({ unpaidIncome: unpaidIncomes, pagination: { currentPage: page, pageSize, totalCount } });
    } catch (error) {
        console.error('Error fetching unpaid income data:', error);
        res.status(500).json({ message: 'Failed to fetch unpaid income data', error: error.detail });
    } finally {
        client.release();
    }
});

app.get('/rejectedIncome', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;
        const searchTerm = req.query.search || '';

        let query = `SELECT * FROM payout_table WHERE user_id = $1 AND status = 'Rejected'`;
        const queryParams = [userId];

        if (searchTerm) {
            query += ` AND (member ILIKE $${queryParams.length + 1} OR mobile ILIKE $${queryParams.length + 2} OR amount::text ILIKE $${queryParams.length + 3})`;
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
        }

        query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(pageSize, offset);

        const { rows: unpaidIncomes } = await client.query(query, queryParams);

        const countQuery = `SELECT COUNT(*) AS total FROM payout_table WHERE user_id = $1 AND status = 'Rejected' ${searchTerm ? `AND (member ILIKE $2 OR mobile ILIKE $3 OR amount::text ILIKE $4)` : ''}`;
        const countQueryParams = searchTerm ? [userId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`] : [userId];
        const { rows: countResult } = await client.query(countQuery, countQueryParams);
        const totalCount = parseInt(countResult[0].total, 10);

        res.json({ unpaidIncome: unpaidIncomes, pagination: { currentPage: page, pageSize, totalCount } });
    } catch (error) {
        console.error('Error fetching rejected payouts income data:', error);
        res.status(500).json({ message: 'Failed to fetch unpaid income data', error: error.detail });
    } finally {
        client.release();
    }
});

app.put('/api/payouts/makePaid', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const { ids } = req.body;

        //Input Validation - check that the ids are integers (e.g., use parseInt)
        if (!Array.isArray(ids) || ids.some(isNaN)) {
            return res.status(400).json({ error: "Invalid ids provided" });
        }

        await client.query('BEGIN'); // Begin transaction

        const updateQuery = `
            UPDATE payout_table
            SET status = 'Paid', approval_date = NOW()
            WHERE id = ANY($1)
            RETURNING id;
        `;

        const updateValues = [ids];

        const updateResult = await client.query(updateQuery, updateValues);

        if (updateResult.rowCount > 0) {
            await client.query('COMMIT');
            res.json({ message: `${updateResult.rowCount} payouts marked as paid.` });
        } else {
            await client.query('ROLLBACK');
            res.status(404).json({ message: "No matching payouts found." })
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating payouts:', error);
        res.status(500).json({ error: 'Failed to update payouts.' });
    } finally {
        client.release();
    }
});

app.get('/summary', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userId = req.user.userId;
        const summary = {};

        //Helper Function to handle potential NaN values
        const handlePotentialNaN = (value) => {
            const num = parseFloat(value);
            return isNaN(num) ? 0.00 : num.toFixed(2); //Return 0.00 if NaN
        }

        // 1. Fund Transfer Amounts (Received)
        const fundTransferResult = await client.query(
            `
            SELECT 
                SUM(CASE WHEN toid = $1 THEN amount ELSE 0 END) as total_received
            FROM wallettransactions
            WHERE transactiontype = 'FUND_TRANSFER';
        `, [userId]
        );
        summary.fundTransferReceived = handlePotentialNaN(fundTransferResult.rows[0].total_received);

        // 2. Pending Add Funds Request Amount
        const pendingFundsResult = await client.query(
            `
            SELECT SUM(amount) AS total_pending
            FROM add_funds
            WHERE user_id = $1 AND status = 'pending';
        `, [userId]
        );
        summary.pendingFunds = handlePotentialNaN(pendingFundsResult.rows[0].total_pending);

        // 3. Fetch Unpaid Income (payout_table)
        const unpaidIncomeResult = await client.query(
            `
            SELECT SUM(amount) AS total_unpaid
            FROM payout_table
            WHERE user_id = $1 AND status IN ('Pending', 'Unpaid'); 
        `, [userId]
        );
        summary.unpaidIncome = handlePotentialNaN(unpaidIncomeResult.rows[0].total_unpaid);

        // 4. Fetch Paid Income (payout_table)
        const paidIncomeResult = await client.query(
            `
            SELECT SUM(amount) AS total_paid
            FROM payout_table
            WHERE user_id = $1 AND status = 'Paid';
        `, [userId]
        );
        summary.paidIncome = handlePotentialNaN(paidIncomeResult.rows[0].total_paid);

        // 5. Fetch Total Earnings from Boards 
        const totalEarningsQuery = `
            SELECT 
                COALESCE(SUM(earnings), 0) AS total_earnings 
            FROM boards
            WHERE userid = $1 AND status = 'ACTIVE';  
        `;
        const totalEarningsResult = await client.query(totalEarningsQuery, [userId]);
        summary.totalEarnings = handlePotentialNaN(totalEarningsResult.rows[0].total_earnings);


        res.json(summary);

    } catch (error) {
        console.error('Error fetching summary data:', error);
        res.status(500).json({ message: 'Failed to fetch summary data.' });
    } finally {
        client.release();
    }
});

app.get('/member-counts', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        // Get total member count (excluding admins)
        const totalMembersResult = await client.query(
            'SELECT COUNT(*) AS total_members FROM users WHERE role != \'admin\''
        );
        const totalMembers = parseInt(totalMembersResult.rows[0].total_members, 10);

        // Get active member count
        const activeMembersResult = await client.query(
            'SELECT COUNT(*) AS active_members FROM users WHERE role != \'admin\' AND status = \'Active\''
        );
        const activeMembers = parseInt(activeMembersResult.rows[0].active_members, 10);

        res.json({ totalMembers, activeMembers });
    } catch (error) {
        console.error('Error fetching member counts:', error);
        res.status(500).json({ message: 'Failed to fetch member counts.' });
    } finally {
        client.release();
    }
});

app.post('/process-payout', authenticateToken, async (req, res) => {
    const { userId, amount, method, reason } = req.body;

    // Input validation
    if (!userId || !amount || !method || !reason) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Invalid amount. Must be a positive number.' });
    }
    if (!['bank', 'upi'].includes(method)) { // Add other allowed methods here
        return res.status(400).json({ message: 'Invalid payment method' });
    }

    const client = await pgPool.connect();
    try {
        //Check if user exists
        const userCheckQuery = 'SELECT * FROM users WHERE user_id = $1';
        const userCheckResult = await client.query(userCheckQuery, [userId]);

        if (userCheckResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check user balance (replace with your actual balance field)
        const balanceCheckQuery = 'SELECT silver_board_income,gold_board_income,diamond_board_income,platinum_board_income,king_board_income FROM users WHERE user_id = $1';
        const balanceCheckResult = await client.query(balanceCheckQuery, [userId]);
        const userBalance = parseFloat(balanceCheckResult.rows[0].silver_board_income) + parseFloat(balanceCheckResult.rows[0].gold_board_income) + parseFloat(balanceCheckResult.rows[0].diamond_board_income) + parseFloat(balanceCheckResult.rows[0].platinum_board_income) + parseFloat(balanceCheckResult.rows[0].king_board_income);

        if (userBalance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }


        //Begin Transaction
        await client.query('BEGIN');

        const { rows: userBoards } = await client.query(`
            SELECT boardtype 
            FROM boards 
            WHERE userid = $1 AND status='ACTIVE'
        `, [userId]);

        if (userBoards.length === 0) {
            throw new Error('User is not active on any board.');
        }

        // Define board hierarchy
        const boardHierarchy = ['silver', 'gold', 'diamond', 'platinum', 'king'];

        // Sort the user's active boards by the board hierarchy
        const sortedBoards = userBoards.sort((a, b) => {
            return boardHierarchy.indexOf(a.boardtype) - boardHierarchy.indexOf(b.boardtype);
        });

        // The top board (first in the sorted list)
        const topBoard = sortedBoards[0].boardtype.toLowerCase();
        const targetBoardIncomeColumn = `${topBoard}_board_income`;

        const updateBalanceQuery = `UPDATE users SET ${targetBoardIncomeColumn} = ${targetBoardIncomeColumn} - $1 WHERE user_id = $2`;
        await client.query(updateBalanceQuery, [amount, userId]);

        // Record the payout transaction (adapt to your schema)
        const transactionQuery = `
            INSERT INTO payout_table (user_id, amount, method, reason, transaction_id)
            VALUES ($1, $2, $3, $4, uuidv4()) RETURNING transaction_id
        `;
        const transactionResult = await client.query(transactionQuery, [userId, amount, method, reason]);
        const transactionId = transactionResult.rows[0].transaction_id;
        await recordWalletTransaction(req.user.userId, amount, 'PAYOUT_TRANSFER', userId);
        //Commit transaction
        await client.query('COMMIT');

        res.json({ message: 'Payout successful', transactionId });
    } catch (error) {
        //Rollback transaction if error occurs
        await client.query('ROLLBACK');
        console.error('Error processing payout:', error);
        res.status(500).json({ message: 'Failed to process payout' });
    } finally {
        client.release();
    }
});

app.put('/api/payouts/updateStatus/:payoutId', authenticateToken, authorizeAdmin, async (req, res) => {
    const payoutId = parseInt(req.params.payoutId, 10); //Added parseInt to ensure integer value
    const { status } = req.body;

    // Input validation (crucial for security)
    if (!payoutId || !status || !['paid', 'reject'].includes(status)) {
        return res.status(400).json({ error: 'Invalid request parameters.' });
    }

    const client = await pgPool.connect();
    try {
        const updateQuery = `
            UPDATE payout_table
            SET status = $1
            WHERE id = $2
            RETURNING id, status;
        `;
        const values = [status, payoutId];

        const result = await client.query(updateQuery, values);
        if (result.rowCount === 1) {
            res.json({ message: 'Payout status updated successfully.', payout: result.rows[0] });
        } else {
            res.status(404).json({ error: 'Payout not found or already updated.' });
        }
    } catch (error) {
        console.error('Error updating payout status:', error);
        res.status(500).json({ error: 'Failed to update payout status.' });
    } finally {
        client.release();
    }
});

app.get('/payout-history', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        // Build the query dynamically based on search term. Parameterized for security.
        let query = `
            SELECT 
                COUNT(*) OVER () AS total_count, -- total count for pagination
                pt.*, 
                u.username AS member_name, 
                COALESCE(b.bank_name, '') as bank_details, 
                COALESCE(upi.upi_address, '') AS upi_details
            FROM payout_table pt
            JOIN users u ON pt.user_id = u.user_id  
            LEFT JOIN banks b ON pt.user_id = b.user_id  -- Join with bank details (if any)
            LEFT JOIN upis upi ON pt.user_id = upi.user_id -- Join with UPI details (if any)
        `;

        const queryParams = []; //Array to store the queryParams
        if (searchTerm) {
            query += `WHERE LOWER(pt.member) LIKE LOWER($1) OR LOWER(pt.mobile) LIKE LOWER($2) OR pt.amount::TEXT LIKE $3`; //Case insensitive search
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
        }

        query += ` ORDER BY pt.withdrawal_date DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(pageSize, offset); // Add pagination parameters


        const result = await client.query(query, queryParams);

        // Extract total count from the first row
        const totalCount = result.rows.length > 0 ? result.rows[0].total_count : 0;
        // Remove total count from result rows (not needed in client)
        const payoutHistory = result.rows.map(row => {
            delete row.total_count;
            return row;
        });

        res.json({ payoutHistory, totalCount, currentPage: page, pageSize });
    } catch (error) {
        console.error('Error fetching payout history:', error);
        res.status(500).json({ message: 'Failed to fetch payout history.' });
    } finally {
        client.release();
    }
});

app.get('/admin/download/payout-excel', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const searchTerm = req.query.search || '';

        //Query to fetch payout data with necessary joins (same as before)
        let query = `
            SELECT 
                pt.payout_id, 
                pt.user_id, 
                pt.amount, 
                pt.payout_date, 
                pt.method, 
                pt.status, 
                pt.transaction_id, 
                pt.reason,
                u.username AS member_name,
                b.account_holder_name AS bank_account_holder,
                b.account_number AS bank_account_number,
                b.bank_name AS bank_name,
                b.bank_ifsc AS bank_ifsc,
                b.bank_branch AS bank_branch,
                upi.upi_address AS upi_address,
                upi.image_name AS upi_image
            FROM payout_table pt
            JOIN users u ON pt.user_id = u.user_id
            LEFT JOIN banks b ON pt.user_id = b.user_id
            LEFT JOIN upis upi ON pt.user_id = upi.user_id
        `;
        const queryParams = [];
        if (searchTerm) {
            query += ` WHERE LOWER(u.username) LIKE LOWER($1) OR LOWER(pt.mobile) LIKE LOWER($2) OR pt.amount::text LIKE $3`;
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
        }

        const { rows: payoutData } = await client.query(query, queryParams);

        // Prepare data for Excel sheet with all columns
        const worksheetData = payoutData.map((payout, index) => ({
            'S.NO': index + 1,
            'Payout ID': payout.payout_id,
            'Member': payout.member_name,
            'User ID': payout.user_id,
            'Amount': payout.amount,
            'Payout Date': payout.payout_date,
            'Method': payout.method,
            'Status': payout.status,
            'Transaction ID': payout.transaction_id,
            'Reason': payout.reason,
            'Bank Account Holder': payout.bank_account_holder,
            'Bank Account Number': payout.bank_account_number,
            'Bank Name': payout.bank_name,
            'Bank IFSC': payout.bank_ifsc,
            'Bank Branch': payout.bank_branch,
            'UPI Address': payout.upi_address,
            'UPI Image': payout.upi_image
        }));

        // Create Excel workbook and worksheet
        const worksheet = xlsx.utils.json_to_sheet(worksheetData);
        const workbook = xlsx.utils.book_new();
        const worksheetName = 'Payout History';
        xlsx.utils.book_append_sheet(workbook, worksheet, worksheetName);

        // Add styling to the worksheet (optional)
        const ws = workbook.Sheets[worksheetName];
        // Example: Add bold header row
        xlsx.utils.sheet_add_aoa(ws, [['S.NO', 'Payout ID', 'Member', 'User ID', 'Amount', 'Payout Date', 'Method', 'Status', 'Transaction ID', 'Reason', 'Bank Account Holder', 'Bank Account Number', 'Bank Name', 'Bank IFSC', 'Bank Branch', 'UPI Address', 'UPI Image']], { origin: 'A1', readOnly: false });
        const headerRow = ws['!ref'].split(':')[0].slice(0, -1) + '1';
        ws[headerRow]['!s'] = { font: { bold: true } };

        // Generate Excel file buffer
        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Send response to client with updated headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=aghan_payout_history.xlsx');
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('Error generating Excel file.');
    } finally {
        client.release();
    }
});

app.get('/admin/download/members-excel', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const { searchTerm, fromDate, toDate, pageSize, page } = req.query;
        const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);

        let query = `
            SELECT
                COUNT(*) OVER () AS total_count,
                u.user_id,
                u.username,
                u.introducer_id,
                u.mobile,
                u.email,
                u.created_at,
                u.lock_status,
                u.withdrawal_lock_status,
                COALESCE(b.account_holder_name, '') as bank_account_holder,
                COALESCE(b.account_number, '') as bank_account_number,
                COALESCE(b.bank_name, '') as bank_name,
                COALESCE(b.bank_ifsc, '') as bank_ifsc,
                COALESCE(b.bank_branch, '') as bank_branch,
                COALESCE(upi.upi_address, '') as upi_address,
                COALESCE(upi.image_name, '') as upi_image,
                (SELECT COUNT(*) FROM users WHERE introducer_id = u.user_id) as referral_count
            FROM users u
            LEFT JOIN banks b ON u.user_id = b.user_id
            LEFT JOIN upis upi ON u.user_id = upi.user_id
        `;
        const queryParams = [];
        let paramIndex = 1;
        const whereClauses = [];

        if (searchTerm) {
            whereClauses.push(`LOWER(u.username) LIKE LOWER($${paramIndex++}) OR LOWER(u.user_id) LIKE LOWER($${paramIndex++}) OR LOWER(u.mobile) LIKE LOWER($${paramIndex++})`);
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
        }

        if (fromDate) {
            whereClauses.push(`u.created_at >= $${paramIndex++}`);
            queryParams.push(fromDate);
        }

        if (toDate) {
            whereClauses.push(`u.created_at <= $${paramIndex++}`);
            queryParams.push(toDate);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        query += ` ORDER BY u.user_id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(pageSize, offset);

        const { rows: members } = await client.query(query, queryParams);
        const totalCount = members.length > 0 ? members[0].total_count : 0;
        const paginatedMembers = members.map(member => {
            delete member.total_count;
            return member;
        });

        const worksheetData = paginatedMembers.map((member, index) => ({
            'S.NO': index + 1,
            'User ID': member.user_id,
            'Username': member.username,
            'Introducer ID': member.introducer_id,
            'Referral Count': member.referral_count,
            'Mobile': member.mobile,
            'Email': member.email,
            'Created At': member.created_at,
            'Lock Status': member.lock_status,
            'Withdrawal Lock Status': member.withdrawal_lock_status,
            'Bank Account Holder': member.bank_account_holder,
            'Bank Account Number': member.bank_account_number,
            'Bank Name': member.bank_name,
            'Bank IFSC': member.bank_ifsc,
            'Bank Branch': member.bank_branch,
            'UPI Address': member.upi_address,
            'UPI Image': member.upi_image,
        }));

        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet([]);

        if (worksheetData.length > 0) {
            // Extract headers dynamically if data exists
            const headers = Object.keys(worksheetData[0]);
            xlsx.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });
            xlsx.utils.sheet_add_json(worksheet, worksheetData, { origin: 'A2', skipHeader: true });
        } else {
            // Provide a default header row if no data is available
            const headers = [
                'S.NO', 'User ID', 'Username', 'Introducer ID',
                'Mobile', 'Email', 'Created At', 'Lock Status', 'Withdrawal Lock Status',
                'Bank Account Holder', 'Bank Account Number', 'Bank Name',
                'Bank IFSC', 'Bank Branch', 'UPI Address', 'UPI Image'
            ];
            xlsx.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });
        }
        // Append the worksheet to the workbook
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Members');

        // Generate Excel file
        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=aghan_members.xlsx');
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('Error generating Excel file.');
    } finally {
        client.release();
    }
});

// Route for PDF download
app.get('/admin/download/members-pdf', authenticateToken, authorizeAdmin, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const { searchTerm, fromDate, toDate, pageSize, page } = req.query;
        const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);

        let query = `
            SELECT
                COUNT(*) OVER () AS total_count,
                u.user_id,
                u.username,
                u.introducer_id,
                u.mobile,
                u.email,
                u.created_at,
                u.lock_status,
                u.withdrawal_lock_status,
                COALESCE(b.account_holder_name, '') as bank_account_holder,
                COALESCE(b.account_number, '') as bank_account_number,
                COALESCE(b.bank_name, '') as bank_name,
                COALESCE(b.bank_ifsc, '') as bank_ifsc,
                COALESCE(b.bank_branch, '') as bank_branch,
                COALESCE(upi.upi_address, '') as upi_address,
                COALESCE(upi.image_name, '') as upi_image,
                (SELECT COUNT(*) FROM users WHERE introducer_id = u.user_id) as referral_count
            FROM users u
            LEFT JOIN banks b ON u.user_id = b.user_id
            LEFT JOIN upis upi ON u.user_id = upi.user_id
        `;
        const queryParams = [];
        let paramIndex = 1;
        const whereClauses = [];

        if (searchTerm) {
            whereClauses.push(`LOWER(u.username) LIKE LOWER($${paramIndex++}) OR LOWER(u.user_id) LIKE LOWER($${paramIndex++}) OR LOWER(u.mobile) LIKE LOWER($${paramIndex++})`);
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
        }

        if (fromDate) {
            whereClauses.push(`u.created_at >= $${paramIndex++}`);
            queryParams.push(fromDate);
        }

        if (toDate) {
            whereClauses.push(`u.created_at <= $${paramIndex++}`);
            queryParams.push(toDate);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        query += ` ORDER BY u.user_id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(pageSize, offset);

        const { rows: members } = await client.query(query, queryParams);
        console.log(members)
        //Handle empty result set
        if (members.length === 0) {
            return res.status(404).json({ message: 'No members found.' });
        }

        const body = members.map((member, index) => [
            index + 1, // Dynamically compute the serial number
            member.user_id,
            member.username,
            member.introducer_id,
            member.mobile,
            member.email,
            member.lock_status,
            member.withdrawal_lock_status,
        ]);

        const doc = jsPDF();
        doc.setFontSize(10)

        // Pass headers and transformed body to autoTable
        doc.autoTable({
            head: [['SNO', 'USER ID', 'USERNAME', 'INTRODUCER ID', 'MOBILE', 'EMAIL', 'LOCK STATUS', 'WITHDRAWAL LOCK STATUS']],
            body, // Array of arrays
            columnStyles: {
                0: { cellWidth: 15 }, // Optional: adjust column width for serial number
            },
        });


        const pdfBuffer = doc.output('arraybuffer');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=aghan_members.pdf');
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
    } finally {
        client.release();
    }
});

app.get('/users/undelivered-achievers', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * pageSize;

        // SQL query to select users NOT IN achieved_users
        const query = `
            SELECT user_id, username 
            FROM users
            WHERE user_id NOT IN (SELECT user_id FROM achieved_users)
            ${searchTerm ? `AND LOWER(username) LIKE LOWER($1)` : ''}
            ORDER BY user_id  -- or any other relevant column
            LIMIT $${searchTerm ? '2' : '1'} OFFSET $${searchTerm ? '3' : '2'}
        `;

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM users
            WHERE user_id NOT IN (SELECT user_id FROM achieved_users)
            ${searchTerm ? `AND LOWER(username) LIKE LOWER($1)` : ''}
        `;


        const params = searchTerm ? [`%${searchTerm}%`, pageSize, offset] : [pageSize, offset];
        const countResult = await client.query(countQuery, searchTerm ? [`%${searchTerm}%`] : []);
        const totalCount = parseInt(countResult.rows[0].total, 10);

        const { rows: undeliveredAchievers } = await client.query(query, params);



        res.json({ undeliveredAchievers, totalCount });
    } catch (error) {
        console.error('Error fetching undelivered achievers:', error);
        res.status(500).json({ message: 'Failed to fetch undelivered achievers' });
    } finally {
        client.release();
    }
});

app.post('/users/deliver-achievers', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const userIds = req.body.userIds; // Array of user IDs to mark as delivered

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'Invalid user IDs provided.' });
        }

        // Use a transaction to ensure all updates or inserts happen atomically.
        await client.query('BEGIN');

        const insertQuery = `
        INSERT INTO achieved_users (user_id, reward, achieved_at, status) 
        VALUES ($1, $2, NOW(), 'delivered')  returning *;`;


        //Assuming a reward will be a part of the request:
        const reward = req.body.reward || 'Default Reward'; // Provide a default reward if none is given

        const results = [];
        for (const userId of userIds) {
            const insertResult = await client.query(insertQuery, [userId, reward]);
            results.push(insertResult.rows[0]); // Store inserted rows
        }


        await client.query('COMMIT');

        res.json({ message: 'Achievers delivered successfully', results });
    } catch (error) {
        await client.query('ROLLBACK'); // Rollback if any insert fails
        console.error('Error delivering achievers:', error);
        res.status(500).json({ message: 'Failed to deliver achievers.' });
    } finally {
        client.release();
    }
});

app.get('/generate-excel/undelivered-achievers', authenticateToken, async (req, res) => {
    const client = await pgPool.connect();
    try {
        const searchTerm = req.query.search || '';

        const query = `
      SELECT user_id, username
      FROM users
      WHERE user_id NOT IN (SELECT user_id FROM achieved_users)
      ${searchTerm ? `AND LOWER(username) LIKE LOWER($1)` : ''}
      ORDER BY user_id
    `;

        const params = searchTerm ? [`%${searchTerm}%`] : [];
        const { rows: undeliveredAchievers } = await client.query(query, params);

        const worksheet = xlsx.utils.json_to_sheet(undeliveredAchievers);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Undelivered Achievers");

        const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=aghan_undelivered_achievers.xlsx');

        res.send(excelBuffer);  // Send the buffer directly as the response

    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).json({ message: 'Failed to generate Excel file.' });
    } finally {
        client.release();
    }
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
