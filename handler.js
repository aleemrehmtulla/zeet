const serverless = require("serverless-http");
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");
const { google } = require("googleapis");
const fs = require("fs");
const app = express();

// create supabase
const supabase = createClient(
  "https://szofxeotztzlmqzgiisn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2Z4ZW90enR6bG1xemdpaXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDgxOTQzNDcsImV4cCI6MTk2Mzc3MDM0N30.RUTB_hydmhWHGGc6-3vxrWMj0sBUdVDJYVa8Xx7Mloc"
);

// create google cloud
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

app.use(express.json());

const database = {
  // "aleem@buildspace.so": {
  //   name: "Aleem Rehmtulla",
  //   picture:
  //     "https://lh3.googleusercontent.com/a-/AOh14GjjltBrDVuYpk6HwkEhk21KyCQv2ujkOOyZ7CZo=s96-c",
  //   token: {
  //     access_token:
  //       "ya29.A0ARrdaM_KZZvWOHOukE_22yPTjlRml2OnMklM2X-ucbHAmg8mzqJOjfRYO9UK5qdjGtBHZbIU81V5PBvmYanmgXnxuCCALOM2yc81l31X32YK6Q9VkHC-jKhEbMK2k-GJzS3vCsaEgT6ncUX9xtOi9b1k872siA",
  //     scope:
  //       "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/calendar",
  //     token_type: "Bearer",
  //     id_token:
  //       "eyJhbGciOiJSUzI1NiIsImtpZCI6IjU4YjQyOTY2MmRiMDc4NmYyZWZlZmUxM2MxZWIxMmEyOGRjNDQyZDAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI4NTA2NDUxODkzMy00OWNiNGlpNW45NTluczN1NzNhbmwzMjhxdWxjbjBtaS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6Ijg1MDY0NTE4OTMzLTQ5Y2I0aWk1bjk1OW5zM3U3M2FubDMyOHF1bGNuMG1pLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA2NzkzNjg2MDA0Nzg5Mjg0NzQ2IiwiaGQiOiJidWlsZHNwYWNlLnNvIiwiZW1haWwiOiJhbGVlbUBidWlsZHNwYWNlLnNvIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJtSVJBUkFqRGhqd2pfaDgyR3J4Zlp3IiwibmFtZSI6IkFsZWVtIFJlaG10dWxsYSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS0vQU9oMTRHampsdEJyRFZ1WXBrNkh3a0VoazIxS3lDUXYydWprT095WjdDWm89czk2LWMiLCJnaXZlbl9uYW1lIjoiQWxlZW0iLCJmYW1pbHlfbmFtZSI6IlJlaG10dWxsYSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjQ4Mjc4NDMxLCJleHAiOjE2NDgyODIwMzF9.TfPWzsR5jDnqzatCU3GshfDWAhU9oIJn3zbfGCvC7VTtjhgyXejMSbZnQqZFUHXAuOxCCNu6jLSTtrlZ0bslN3OmJ6HmcSgmeuAix897rqsbQYtU1QxcE0Iq4QNp9fH0tBxwHsWfz_CNXwkC9SYK-mJiCeZxU0AALNe-nAl3YhNYEgLU0DegHt2EDV0KvQsN_mu9nSotRPR__a0q7eTGB6JLxb6DUlgdKhle8rCkGKlvQLrJl7G-raVPakkVOITO07cAhBur3MEjCTu3bddDmTETVH7SOKAUkdQtpLDgkUZveF826KY_Hw7VWeGvz7W8WgTuXnDlkuo9ANNcd3UobA",
  //     expiry_date: 1648282030990,
  //   },
  // },
};

app.get("/oauth/google", (req, res) => {
  const content = fs.readFileSync("creds.json", "utf-8"); // get token from file

  const OAuthClient = GetOAuth2(JSON.parse(content)); // add token to oauth client
  res.redirect(getAccessTokenURL(OAuthClient)); // redirect user to google auth url
});

app.get("/oauth/", async (req, res) => {
  const { code, scope } = req.query; // we get the code from the query params of URL
  const content = fs.readFileSync("creds.json", "utf-8"); // get token from file

  const OAuthClient = GetOAuth2(JSON.parse(content));

  // get the token from oauth client
  OAuthClient.getToken(code, async (err, token) => {
    if (err) return console.log("There was an error creating your account");
    OAuthClient.setCredentials(token); // setting credentials to token
    const { access_token, id_token } = token; // getting access and id from token

    // fetching user email and name from google servers
    const googleUser = await axios
      .get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
        {
          headers: {
            Authorization: `Bearer ${id_token}`,
          },
        }
      )
      .then((res) => res.data)
      .catch((error) => {
        console.error(`Failed to fetch user`);
        throw new Error(error.message);
      });

    // adding google user, along with refresh token to database
    if (googleUser) {
      const { name, email, picture } = googleUser;

      database[email] = {
        name,
        picture,
        token: token,
      };
      const { data, error } = await supabase.from("Test").upsert({
        id: 3,
        refresh: {
          name,
          picture,
          token: token,
        },
      });
    }

    // sending  "done"
    return res.send("done");
  });
});

app.post("/create", async (req, res) => {
  // this is the route for creating events
  const { email, event } = req.body;

  if (!email) return res.send("Please provide an email");
  if (!event) return res.send("Please provide an event to add");

  const { data, error } = await supabase
    .from("Test")
    .select("refresh")
    .eq("name", "The Shire");

  const wow = await data[0].refresh;

  const { token } = wow; // get token from database

  // read credentials file
  fs.readFile("creds.json", (err, content) => {
    if (err) return res.send("There was an error");
    const oauth = GetOAuth2(JSON.parse(content));
    oauth.setCredentials(token);
    createEvent(oauth, event, (response) => res.send(response));
  });
});

app.get("/getUser", async (req, res) => {
  // this is the route for creating events

  const { data, error } = await supabase
    .from("Test")
    .select("userDetails")
    .eq("name", "The Shire");

  const wow = await data;

  // read credentials fil
  res.send(wow);
});

function createEvent(auth, event, cb) {
  const calendar = google.calendar({ version: "v3", auth });
  calendar.events.insert(
    {
      auth: auth,
      calendarId: "primary",
      resource: event,
    },
    (err, res) => {
      if (err) {
        cb({ error: "There was an error creating your event " + err });
      } else {
        cb(res);
      }
    }
  );
}

function GetOAuth2(credentials) {
  // this function returns an oauth2 object with some given credentials
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  return oAuth2Client;
}
//
function getAccessTokenURL(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  return authUrl;
}

if (process.env.NODE_ENV === "dev") {
  app.listen(3000, () => console.log("Server started on port 3000"));
} else {
  module.exports.handler = serverless(app);
}
