import * as nodemailer from 'nodemailer'

export const sendEmail = (to:string, otp:string, type?:string) => {
    try{

        let transporter = nodemailer.createTransport({
            host: "smtp.zoho.com",
            secure: true,
            port: 465,
            auth: {
              user: "hello@allwebtool.com",
              pass: "uNv0KLERpvgR",
            },
          });

        const mailOptions = {
            from:'hello@allwebtool.com',
            to: to, 
            subject: 'Allwebtool Email Verification',
            html: `<h1>${otp}</h1>`,
        };
        
        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return error
            } else {
                console.log('Email sent successfully:', info);
                return true
            }
        });

    }catch(e){
        console.log(e.message)
    }
   
}