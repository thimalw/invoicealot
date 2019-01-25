const initTemplate = info => {
  const template = {};

  template.subject = `Your new ${process.env.APP_NAME} account is almost ready!`;

  template.html = `<p>Hi ${info.firstName}</p>
<p>Welcome to your new ${process.env.APP_NAME} account! Just click on the verification link below and you'll be ready to start making invoices.</p>

<p><a href="${process.env.CLIENT_URL}/verify/${info.emailToken}">Verify Email</a></p>`;

  template.text = `Hi ${info.firstName}.

Welcome to your new ${process.env.APP_NAME} account! Just click on the verification link below and you'll be ready to start making invoices.

${process.env.CLIENT_URL}/verify/${info.emailToken}`;
  
  return template;
};

module.exports = initTemplate;
