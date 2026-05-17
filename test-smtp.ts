import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'medonex.official1@gmail.com',
    pass: 'xljxuzwuegtcivzg',
  },
});

async function test() {
  try {
    console.log("Verifying connection...");
    await transporter.verify();
    console.log("Connection verified!");

    console.log("Sending email...");
    const info = await transporter.sendMail({
      from: '"MedOneX" <medonex.official1@gmail.com>',
      to: 'skillyvibesahmedhassan0@gmail.com',
      subject: 'Urgent Test Email from Nodemailer',
      text: 'This is a test email sent to verify deliverability. Please check if this arrived in Primary or Spam.',
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
