const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const notifyCustomer = async (phone, message) => {
  console.log(`Sending notification to customer: ${phone}`);
  try {
    const msg = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, 
      to: phone, 
    });
    console.log(`Customer notification sent: SID=${msg.sid}, to=${msg.to}, body="${msg.body}"`);
  } catch (error) {
    console.error('Twilio error (customer):', error);
  }
};

const notifyMechanic = async (phone, message) => {
  try {
    const msg = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    console.log(`Mechanic notification sent: SID=${msg.sid}, to=${msg.to}, body="${msg.body}"`);
  } catch (error) {
    console.error('Twilio error (mechanic):', error);
  }
};

module.exports = { notifyCustomer, notifyMechanic };
