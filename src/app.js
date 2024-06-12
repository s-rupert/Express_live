require('dotenv').config();
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const express = require('express');
const path = require('path');
const JOBS=require('./jobs.js'); 
const mustacheExpress = require('mustache-express');

// const fetch = require('node-fetch');
const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

const hCaptchaSecret = '4f3d7976-833d-4973-bae8-0745e7f920ab';

app.use(express.static(path.join(__dirname,'public')));

app.set('views', path.join(__dirname,'pages'));
app.set('view engine', 'mustache');
app.engine('mustache', mustacheExpress());



app.get('/', (req, res) => {
   res.render('index',{jobs:JOBS});
    // res.sendFile(path.join(__dirname, 'pages/index.html'));
})

app.get('/jobs/:id', (req, res) => {
    const id = req.params.id;
    const matchedJob = JOBS.find(job => job.id.toString() === id);
    res.render('job', { job: matchedJob});
})


app.post('/jobs/:id/apply',upload.single('file'), async(req, res) => {
    const { name, email, phone, dob, position, coverletter, 'h-captcha-response': hCaptchaResponse } = req.body;
    const id = req.params.id;
    const matchedJob = JOBS.find(job => job.id.toString() === id);
    const file=req.file;
    const fileContent = fs.readFileSync(file.path);

    if (!hCaptchaResponse) {
      return res.status(400).send('Please complete the hCaptcha.');
  }
  const verificationUrl = `https://hcaptcha.com/siteverify?secret=${hCaptchaSecret}&response=${hCaptchaResponse}`;
    const hCaptchaVerification = await fetch(verificationUrl, { method: 'POST' });
    const hCaptchaVerificationData = await hCaptchaVerification.json();

   
    const mailOptions = {
      from: process.env.EMAIL_ID,
      to: process.env.EMAIL_ID,
      subject: `New Application for ${matchedJob.title}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Date of Birth:</strong> ${dob}</p>
        <p><strong>Cover Letter:</strong> ${coverletter}</p>
      `,
      attachments:[{
        filename: file.originalname,
        content:fileContent,
      },
      ],
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).send('Error sending email');
      } else {
        console.log('Email sent: ' + info.response);
        res.status(200).render('applied');
      }
    });
  });


const transporter = nodemailer.createTransport({
    host: 'mail.gmx.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASSWORD
    }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on https://localhost:${port}`);
})  