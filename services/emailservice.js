const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendWelcomeEmail(email, companyName) {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Welkom bij CarbonComply! 🌱',
            html: `
                <h2>Welkom bij CarbonComply, ${companyName}!</h2>
                <p>Je account is succesvol aangemaakt.</p>
                <p><a href="${process.env.FRONTEND_URL}">Start je eerste berekening</a></p>
            `
        });
    } catch (error) {
        console.error('Email sending failed:', error);
    }
}

module.exports = { sendWelcomeEmail };
