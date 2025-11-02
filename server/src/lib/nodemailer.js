import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'Gmail',
      auth: {
        user: process.env.SMPT_USER,
        pass: process.env.SMPT_PASSWORD,
      },
});

const sendOtp = async (email, otp) => {
    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "OTP Verification",
        text: `Your OTP is: ${otp}`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

export const sendResetPasswordEmail = async (email, resetCode) => {
    const resetLink = `http://localhost:5173/reset-password?code=${resetCode}&email=${email}`;
    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Password Reset",
        text: `Click the link to reset your password: ${resetLink}`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}


export default sendOtp