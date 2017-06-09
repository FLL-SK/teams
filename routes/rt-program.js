const mongoose = require('mongoose');
const express = require('express');
const cel = require('connect-ensure-login');
const router = express.Router();

const Program = mongoose.models.Program;

module.exports = router;

router.get('/', cel.ensureLoggedIn('/login'), async function (req, res, next) {
    const cmd = req.query.cmd;
    console.log("/program - get");
    console.log(req.query);
    const r = {result:"error", status:200};
    switch (cmd){
        case 'getList':
            console.log('Going to get list of programs');
            const p = await Program.find({ recordStatus: 'active' },{name:true, id:true});
            r.result = "ok";
            r.list = p;
            break;
        default:
            console.log("cmd=unknown");

    }
    res.json(r);
    res.end();

});