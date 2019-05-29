const nodemailer = require('nodemailer');
const { to } = require('../helpers');
const User = require('../../../db').model('user');
const UserEmail = require('../../../db').model('userEmail');

const mailUser = async (userId, templateName, info) => {
  let [err, user] = await to(User.findByPk(userId, {
    include: [{
      model: UserEmail,
      where: {
        primary: '1'
      }
    }]
  }));
  
  if (err) {
    throw err;
  }

  if (!user) {
    throw new Error('User not found.');
  }

  info = { 
    ...info,
    firstName: user.firstName,
    lastName: user.lastName
  };
  const initTemplate = require('./templates/' + templateName);
  const template = initTemplate(info);

  let mailSent;
  mailSent = await sendMail(
    `${user.firstName} ${user.lastName} <${user.userEmail[0].email}>`,
    template.subject + ' - ' + process.env.APP_NAME,
    template.html,
    template.text
  );

  return mailSent;
};

// TODO: make asynchronous - https://github.com/nodemailer/nodemailer-amqp-example
const sendMail = async (mailTo, subject, html, text) => {
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: mailTo,
    subject,
    text,
    html
  };

  let info = await transporter.sendMail(mailOptions);

  return info;
}

module.exports = {
  mailUser,
  sendMail
};
