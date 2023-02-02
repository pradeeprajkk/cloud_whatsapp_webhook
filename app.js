const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
require('dotenv').config();

const app = express().use(body_parser.json());

const access_token = process.env.ACCESS_TOKEN;
const myToken = process.env.MY_TOKEN;

app.listen(8000 || process.env.PORT, () => {
    console.log(`Server Running on port: 8000`);
    console.log("webhook is listening...");
});

/**
 * To Verify the callback URL from dashboard side <-> cloud api side
 */
app.get("/webhook", (req, res) => {
    let mode = req.query["hub.mode"];
    let challenge = req.query["hub.challenge"];
    let token = req.query["hub.verify_token"];

    console.log("mode " + mode);
    console.log("challenge " + challenge);
    console.log("token " + token);

    if (mode && token) {

        if (mode === "subscribe" && token === myToken) {
            console.log(JSON.stringify(challenge));
            return res.status(200).send(challenge);
        } else {
            console.log("Condition Not Matched");
            return res.status(403);
        }

    }
});

app.post("/webhook", (req, res) => {
    let payload = req.body;

    console.log(JSON.stringify(payload, null, 2));

    if (payload.object) {
        console.log("inside payload");
        if (payload.entry && 
            payload.entry[0].changes[0] && 
            payload.entry[0].changes[0].value.messages &&
            payload.entry[0].changes[0].value.messages[0]) {
               let phone_no_id = payload.entry[0].changes[0].value.metadata.phone_number_id;
               let from = payload.entry[0].changes[0].value.messages[0].from;
               let msg_body = payload.entry[0].changes[0].value.messages[0].text.body;

               console.log("phone number " + phone_no_id);
               console.log("from " + from);
               console.log("boady param " + msg_body);

               axios({
                method: "POST",
                url: "https://graph.facebook.com/v15.0/" + phone_no_id + "/messages?access_token=" + access_token,
                data: {
                    messaging_product: "whatsapp",
                    to: from,
                    text: {
                        body: "Hello... I'm Pradeep, your message is " + msg_body
                    }
                },
                headers: {
                    "Content-Type": "application/json"
                }
               });

            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    }
});

app.get("/", (req, res) => {
    return res.status(200).send({ success: true, message: "hello this is webhook setup" });
});

/**
 * Send Messages
 */
app.post("/sendMessage", (req, res) => {
    try {
        let { phone_no_id, to }= req.body;
        axios({
            method: "POST",
            url: "https://graph.facebook.com/v15.0/" + phone_no_id + "/messages?access_token=" + access_token,
            data: {
                messaging_product: "whatsapp",
                to: to,
                text: {
                    body: "New Message from Pradeep User 133\nIn the workflow 'Test Circuit12', the answer to the question 'Boolean' is 'Yes'.\nhttps://dev-reports.andonix.com/#/livechat/CH10cf93b442ac44da824b357ac5a2926f"
                }
            },
            headers: {
                "Content-Type": "application/json"
            }
        });
        return res.status(200).send({ status: true, message: 'success', });
    } catch(e) {
        console.log("Error while sending the message", e);
        return res.status(403).send({ status: false, data: [], ...e });;
    }
});