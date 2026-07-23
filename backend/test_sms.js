require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendTestSMS = async (toPhone, toName) => {
  const lat = '12.345';
  const lon = '67.890';
  const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
  const messageBody = `🚨 EMERGENCY SOS ALERT 🚨\nTest User has triggered an SOS and needs immediate help.\n\nDear ${toName},\nPlease check on them. Live Location:\n${mapsLink}`;

  try {
    const message = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone
    });
    console.log(`📱 Test SMS sent to ${toPhone}: ${message.sid}`);
    console.log('✅ Twilio is configured correctly!');
  } catch (error) {
    console.error(`❌ Failed to send test SMS:`, error.message);
    console.error('💡 Make sure your .env has valid TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER');
  }
};

// Replace with an actual phone number (E.164 format, e.g. +919876543210)
sendTestSMS('+919876543210', 'Test Guardian');
