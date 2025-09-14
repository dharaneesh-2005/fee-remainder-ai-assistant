import twilio from 'twilio';

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_CALLER_NUMBER,
} = process.env;

export const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export function placeCall({ to, url }) {
  return twilioClient.calls.create({
    to,
    from: TWILIO_CALLER_NUMBER,
    url, // TwiML webhook URL that returns instructions per student
  });
}
