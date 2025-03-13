const nodemailer = require('nodemailer');
const { logger } = require('./logger');

// Create a nodemailer transporter using environment variables
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Function to send emails
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@yourband.com',
      to,
      subject,
      text,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent:', info.messageId);
    return info;
  } catch (error) {
    logger.error('Email sending error:', error);
    throw error;
  }
};

module.exports = {
  sendEmail
};