require('dotenv').config();
const nodemailer = require('nodemailer');

const createMailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendSOSEmail = async (toEmail, toName, userName, lat, lon) => {
  const transporter = createMailTransporter();
  const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
  
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'SheShield SOS'}" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `🚨 EMERGENCY SOS ALERT from ${userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF4777, #FF8DA1); padding: 20px; border-radius: 12px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY SOS ALERT</h1>
          <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">SheShield Women Safety System</p>
        </div>
        
        <div style="background: #FFF5F6; padding: 24px; border-radius: 12px; margin-top: 16px; border: 1px solid #FFE0E6;">
          <p style="font-size: 16px; color: #333; margin: 0 0 12px;">
            <strong>${userName}</strong> has triggered an <strong style="color: #FF4777;">Emergency SOS Alert</strong> and needs immediate help.
          </p>
          
          <p style="font-size: 14px; color: #555; margin: 0 0 8px;">
            <strong>Dear ${toName},</strong>
          </p>
          <p style="font-size: 14px; color: #555; margin: 0 0 16px;">
            Please check on them immediately. Their live GPS coordinates are below.
          </p>
          
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #E5E7EB;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #666;">
              📍 <strong>Latitude:</strong> ${lat}
            </p>
            <p style="margin: 0 0 12px; font-size: 13px; color: #666;">
              📍 <strong>Longitude:</strong> ${lon}
            </p>
            <a href="${mapsLink}" style="display: inline-block; background: #FF4777; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
              📍 Open Location in Google Maps
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 16px; padding: 12px; background: #F8FAFC; border-radius: 8px;">
          <p style="font-size: 11px; color: #999; margin: 0;">
            This alert was sent via SheShield Women Safety App at ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 SOS Email sent to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send SOS email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

sendSOSEmail('latheeshvalmeti226@gmail.com', 'Valmeti Latheesh', 'Test User', '12.345', '67.890');
