import * as nodemailer from 'nodemailer'

export const sendEmail = (to:string, otp:string, type?:string) => {
    try{

        let transporter = nodemailer.createTransport({
            host: "smtp.zoho.com",
            secure: true,
            port: 465,
            auth: {
              user: "support@marketscape.io",
              pass: "5Rdwz3pbzdzd",
            },
          });

          if(type === "no-reply"){
            transporter = nodemailer.createTransport({
                host: "smtp.zoho.com",
                secure: true,
                port: 465,
                auth: {
                  user: "no-reply@marketscape.io",
                  pass: "WACZr7qAyy6b",
                },
              });

          }else if(type === "me"){
            transporter = nodemailer.createTransport({
                host: "smtp.zoho.com",
                secure: true,
                port: 465,
                auth: {
                  user: "devsamahd@marketscape.io",
                  pass: "91xst6SqYHwR",
                },
              });
          }
        // pass:MArketscape626@ 
        // Email data
        const mailOptions = {
            from: type === "me"?
             'devsamahd@marketscape.io': 
            type === "no-reply" ?
            "no-reply@marketscape.io":"support@marketscape.io",
            to: to, 
            subject: 'MarketScape Email Verification',
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