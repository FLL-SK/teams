'use strict';

const axios = require('axios');

const exp = {};
module.exports = exp;

// Authorization header
const config = {
    headers: {
        'Authorization': `SFAPI email=${process.env.SF_AUTH_EMAIL
        }&apikey=${process.env.SF_AUTH_API_KEY
        }&company_id=${process.env.SF_AUTH_COMPANY_ID
        }&module=${process.env.SF_AUTH_MODULE}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    }
};

const debugLib = require('debug')('lib-SF');
const logERR = require('debug')('ERROR:lib-SF');
const logWARN = require('debug')('WARN:lib-SF');
const logINFO = require('debug')('INFO:lib-SF');

const mongoose = require('mongoose');

const Invoice = mongoose.models.Invoice;

exp.mapInvoiceToSFInvoice = function(i){
    if (!i) {
        logWARN("Invoice not provided");
        return null;
    }

    const sfi = {};
    sfi.Client = {
        name: i.billOrg.name,
        
        address: i.billAdr.addresLine1 + i.billAdr.addresLine2?', '+i.billAdr.addresLine2:'',
        city: i.billAdr.city,
        zip: i.billAdr.postCode,

        ico: i.billOrg.companyNo,
        dic: i.billOrg.taxNo,
        ic_dph: i.billOrg.VATNo,
        
        email: i.billContact.email,
        phone: i.billContact.phone,
        iban: i.billOrg.bankAccount,

        delivery_address: i.billAdr.addresLine1 + i.billAdr.addresLine2?', '+i.billAdr.addresLine2:'',
        delivery_city: i.billAdr.city,
        delivery_zip: i.billAdr.postCode,
        delivery_phone: i.billContact.phone,
    };

    sfi.Invoice = {
        name:`Registracia team ${i.team?i.team.name:'???'} faktura ${i.number}`,
        invoice_no_formatted: i.number,
        created:  i.issuedOn.toISOString().substr(0,10),
        due: i.duedOn.toISOString().substr(0,10),
        payment_type: 'transfer',
        paydate: i.paidOn.toISOString().substr(0,10),
        already_paid: i.paidOn?1:0,
        mark_sent: 1
    };

    sfi.InvoiceItem = i.items.map(itm => ({
        name: itm.text,
        description: itm.note,
        quantity: itm.qty,
        tax:0,
        unit_price: itm.unitPrice
    }));

    debugLib("mapped invoice %o",sfi);

    return sfi;

}

exp.postSFInvoice = async function (sfInvoice) {

    try {
        debugLib('Posting to SF invoice=%o',sfInvoice)
        const result = await axios.post(`${process.env.SF_API_URL}/invoices/create`, 'data=' + JSON.stringify(sfInvoice), config);
        debugLib('result=%o',result);

        if (result.status != 200) {
            logERR(`Failed posting invoice to Superfaktura. code=${result.status} text=${result.statusText}`);
            return false;
        }

        if (result.data.error) {
            logERR('Superfaktura reported error=%o', result.data.error_message);
            return false;
        }

        return true;
    
    } catch(err) {
        logERR(`Error posting invoice to Superfaktura err=${err}`);
    }

    return false;
}