const nodemailer = require('nodemailer');
require('dotenv').config();

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // or another email service you're using
    auth: {
      user: process.env.MAIL, // Your email address
      pass: process.env.PASSWORD, // Your email password or app-specific password
    },
  });
};

const sendEmail = async (to, subject, text, html) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.MAIL, // Your email address
    to: Array.isArray(to) ? to.join(', ') : to,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
