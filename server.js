require("dotenv").config();
const express = require("express");
const { CloudantV1 } = require("@ibm-cloud/cloudant");
const { IamAuthenticator } = require("ibm-cloud-sdk-core");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const client = CloudantV1.newInstance({
  authenticator: new IamAuthenticator({ apikey: process.env.CLOUDANT_APIKEY }),
  serviceUrl: process.env.CLOUDANT_URL,
});
const DB = process.env.CLOUDANT_DB || "taskflow-db";
const DOC = "student-data";

app.get("/api/data", async (req, res) => {
  try {
    const r = await client.getDocument({ db: DB, docId: DOC });
    res.json(r.result);
  } catch (e) {
    if (e.status === 404) return res.json({});
    console.error("read failed:", e.message);
    res.status(500).json({ error: "read failed" });
  }
});

app.put("/api/data", async (req, res) => {
  try {
    const { tasks = [], attendance = null, marks = [], notes = [] } = req.body;
    let rev;
    try {
      rev = (await client.getDocument({ db: DB, docId: DOC })).result._rev;
    } catch (e) {}
    await client.putDocument({
      db: DB,
      docId: DOC,
      document: { tasks, attendance, marks, notes, ...(rev && { _rev: rev }) },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("save failed:", e.message);
    res.status(500).json({ error: "save failed" });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("TaskFlow running"));
