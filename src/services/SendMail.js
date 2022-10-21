import nodemailer from 'nodemailer';
import mailConfig from '../config/mail.js';

async function sendMail(to, subject, text, html) {
  try {
    const config = await mailConfig();

    const transporter = nodemailer.createTransport(config);

    const info = await transporter.sendMail({
      from: 'noreplay@email.com',
      to,
      subject: subject,
      text: text,
      html: html,
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Send email: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (err) {
    throw new Error(err);
  }
}

export default { sendMail };