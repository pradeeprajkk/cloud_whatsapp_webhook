const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
require('dotenv').config();

const app = express().use(body_parser.json());

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const MY_TOKEN = process.env.MY_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

const OpenAI = require('./openAI')

let promptText = "You are an expert in the manufacturing and automotive industry. Your default language is English. The users will call you @andi and you live in an application call it SmartWorkStation by Andonix.";

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

        if (mode === "subscribe" && token === MY_TOKEN) {
            console.log(JSON.stringify(challenge));
            return res.status(200).send(challenge);
        } else {
            console.log("Condition Not Matched");
            return res.status(403);
        }

    }
});

app.post("/webhook", async (req, res) => {
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

               let responseText = "You will be contacted shortly by our CST.";

               if (msg_body.toLowerCase().indexOf("@andi") > -1) {
                    const openaiText = await new OpenAI().chat(promptText, msg_body.replace('@andi', ''), "");
                    responseText = openaiText;
               } 


               axios({
                method: "POST",
                url: "https://graph.facebook.com/v15.0/" + phone_no_id + "/messages?access_token=" + ACCESS_TOKEN,
                data: {
                    messaging_product: "whatsapp",
                    to: from,
                    text: {
                        body: responseText
                    }
                },
                headers: {
                    "Content-Type": "application/json"
                }
                }).then((response) => {
                    console.log(JSON.stringify(response.data));
                    return res.sendStatus(200)
                }).catch((error) => {
                    console.log("Error while sending the message", error);
                    return res.sendStatus(403)
                });
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
        let data = req.body;
        axios({
            method: "POST",
            url: "https://graph.facebook.com/v15.0/" + PHONE_NUMBER_ID + "/messages?access_token=" + ACCESS_TOKEN,
            data: data,
            headers: {
                "Content-Type": "application/json"
            }
        }).then((response) => {
            console.log(JSON.stringify(response.data));
            return res.status(200).send({ status: true, message: 'success', });
        }).catch((error) => {
            throw error;
        });
    } catch(e) {
        console.log("Error while sending the message", e);
        return res.status(403).send({ status: false, data: [], ...e });;
    }
});