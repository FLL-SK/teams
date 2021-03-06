"use strict";

var viewProgram = {};

viewProgram.init = function (rId, u){
    viewProgram.user = JSON.parse(u);
    moment.locale(viewProgram.user.locales.substr(0,2));
    var resId = rId; //getResourceId(location.href);

    if (viewProgram.user.username.length > 0)
        viewProgram.loadManagers(resId);

    viewProgram.loadEvents(resId);
    viewProgram.loadTeams(resId);
    viewProgram.loadDocs(resId);

    if (viewProgram.user.permissions.isAdmin || viewProgram.user.permissions.isProgramManager) {
        $('.editable').editable();
        //$('#endDate').editable()
    }

    $("#exportData").on(
        "click",
        function(){
            // get JSON data
            libProgram.exportData(resId, function(d){
                // convert to CSV
                var data = libCommon.Prog2CSV(d.data,'\t',viewProgram.user.locales, viewProgram.user.permissions.isAdmin?1:0);
                // save to file
                var encodedUri = encodeURI("data:text/csv;charset=utf-8,"+data);
                var link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "program_export_utf8.csv");
                document.body.appendChild(link);

                link.click();

            });
        }
    );

    $("#addManager").on(
        "click",
        function(ev) {
            libModals.editValue(
                "Pridaj manažéra",
                "Používateľ",
                "prihlasovacie meno používateľa",
                "text",
                "",
                function (browserEvent, username, onSuccess, onError) {
                    if (typeof onSuccess !== "function")
                        onSuccess = function (u) {
                            return true;
                        };
                    if (typeof onError !== "function")
                        onError = function (msg) {
                            console.log("ERROR: ", msg);
                        };

                    libProgram.addManager(resId, username, function (res, err) {
                        if (err)
                            return onError(err.message);
                        onSuccess(res);
                    });
                },
                function (res) {
                    console.log("new program manager added");
                    viewProgram.loadManagers(resId);
                },
                function (msg) {
                    alert("Chyba pri pridávaní manažéra programu.\n\n"+msg);
                }
            )
        }

    );

    $("#addEventBtn").on("click", function(){
        var fields = [
            {id:"eventName", label:"Názov", type:"text", required:1},
            {id:"eventIO", label:"Fakturujúca organizácia", type:"select",
                init:function(domid,cb){libCommon.loadList(domid,"/invorg?cmd=getList&active=1", cb)},}
        ];
        libModals.multiFieldDialog(
            "Nové stretnutie/turnaj",
            "Zadajte názov a vyberte fakturujúcu organizáciu",
            fields,
            function (flds, cb) {
                viewProgram.createNewEvent(resId,flds.findById("eventName").value,flds.findById("eventIO").value, cb);
            },
            function cb(res, err) {
                if (err) {
                    console.log("CB-ERROR", err);
                    alert("Nepodarilo sa vytvoriť.\n\n"+err.message);
                } else {
                    console.log("CB-OK Member created");
                    alert("Stretnutie/turnaj bol vytvorený.");
                    viewProgram.loadEvents(resId);
                }
                console.log("CB-DONE");
            }
        );

    });

    $("#addDocBtn").on("click", function(){
        //todo
    });

};

viewProgram.loadManagers = function (progId){
    var site = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
    console.log("Loading program managers");
    var t = $("#pmsList");
    t.empty();
    $.get( "/program/"+progId+"?cmd=getManagers", function(res) {
        console.log("Server returned managers",res);
        if (res.result === 'ok'){
            t.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    if (item.fullName) {
                        var c = $('<a href="' + site + '/profile/' + item._id + '" class="btn btn-success btn-member" role="button">')
                            .append(item.fullName);

                        t.append(c);
                    }

                });
            } else {
                t.text('Žiadni manažéri');
            }
        } else {
            console.log("Server returned ERROR");
        }

    });

};

viewProgram.loadEvents = function (progId){
    var selEv = $('#eventList');
    console.log('Loading events');
    $.get( libCommon.getNoCache("/event?cmd=getList&program="+progId), function(res) {
        console.log("loadProgEvents: Server returned",res);
        if (res.result === 'ok'){
            // sort events by name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            selEv.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    var c = $('<a class="list-group-item" href="/event/'+item._id+'"">').append(item.name
                        +'   (D:'+(item.startDate?(new Date(item.startDate)).toLocaleDateString(viewProgram.user.locales):"neurčený")+')'
                        +'   (R:'+(item.regEndDate?(new Date(item.regEndDate)).toLocaleDateString(viewProgram.user.locales):"neurčený")+')'
                        );
                    selEv.append(c);
                });
            } else {
                selEv.text('Žiadne turnaje');
            }
        } else {
            console.log("loadEvents: Server returned ERROR");
        }

    });

};

viewProgram.loadTeams = function (progId){
    var selEv = $('#teamList');
    console.log('Loading teams');
    //TODO: read list of teams from events
    $.get( libCommon.getNoCache("/teamevent?cmd=getTeams&programId="+progId), function(res) {
        console.log("loadTeams: Server returned",res);
        if (res.result === 'ok'){
            // sort events by name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            selEv.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                var i=1;
                res.list.forEach(function(item) {
                    var c = $('<a class="list-group-item" href="/team/'+item._id+'"">').append((i++)+'. '+item.name+', '+item.foundingOrg.name+', '+item.foundingAdr.city);
                    selEv.append(c);
                });
            } else {
                selEv.text('Žiadne tímy');
            }
        } else {
            console.log("loadTeams: Server returned ERROR");
        }

    });

};

viewProgram.loadDocs = function (progId){
    var sel = $('#docList');
    console.log('Loading documents');
    $.get( libCommon.getNoCache("/docs?cmd=getList&programId="+progId), function(res) {
        console.log("loadDocs: Server returned",res);
        if (res.result === 'ok'){
            // sort by name
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
            sel.empty();
            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                var i=1;
                res.list.forEach(function(item) {
                    if (item.name.length>0) {
                        var c = $('<a class="list-group-item" href="/docs?cmd=download&doc=' + item.key + '"">').append((i++) + '. ' + item.name + ' [' + Math.round(item.size / 1024) + ' kiB]');
                        sel.append(c);
                    }
                });
            } else {
                sel.text('Žiadne dokumenty');
            }
        } else {
            console.log("loadDocs: Server returned ERROR");
        }

    });

};

viewProgram.createNewEvent = function (progId, evName, evInvOrg, cb){
    console.log("Posting request to create new event");
    $.post("/event", {cmd: 'createEvent', name: evName, programId:progId, invOrgId:evInvOrg}, function (res) {
        console.log("createEvent: Server returned",res);
        if (res.result == "ok") {
            console.log("Event created");
            cb(res);
        } else {
            console.log("Error while creating event");
        }
    })
        .fail(function () {
            cb(res, true);
        });
};