"use strict";

function initEvent(){
    const evId = getResourceId(location.href);

    loadRegisteredTeams(evId);

    $("#btnSaveTeamNumber").on("click", function(ev){
        const teamEventId = $("#teamEventId").val();
        const teamNum = $("#teamNumber").val();
        saveTeamNumber(teamEventId, teamNum,
            function (res,err){
                if (err) {
                    console.log("Error saving team number");
                    alert("Nepodarilo sa priradiť tímu číslo.");
                } else {
                    loadRegisteredTeams(evId);
                    alert("Číslo bolo úspešne priradené.");
                    $("#editTeamNumber").modal("hide");
                }
            })
    });

}

function loadRegisteredTeams(eventId){
    const sel = $('#allTeams');
    console.log('Loading registered teams');
    $.get( "/event/"+eventId+"?cmd=getTeams", function(res) {
        console.log("loadTeams: Server returned",res);
        console.log("List of",res.list.length,"records");
        if (res.result === 'ok'){
            // sort results
            res.list.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );

            sel.empty();

            if (res.list.length > 0) {
                console.log("Found ",res.list.length,"records");
                res.list.forEach(function(item) {
                    let c = $('<div class="well well-sm container-fluid">')
                        .append($('<a href="/team/'+item.id+'" >')
                            .append(item.name+(item.teamEvent.teamNumber?"  [#"+item.teamEvent.teamNumber+"]":"")+", "+item.billingAdr.city+", "+item.billingOrg.name))
                        .append(res.isAdmin||res.isEventOrganizer?$('<button id="ETN'+item.teamEvent._id+'" class="btn btn-default btnEditTeamNumber" style="float:right">')
                            .append("Číslo tímu"):'')
                        .append(res.isAdmin||res.isEventOrganizer?$('<button id="CNI'+item.id+'" class="btn btn-default btnCreateNTInvoice" style="float:right">')
                            .append("Vytvor proformu"):'')
                        .append(res.isAdmin||res.isEventOrganizer?$('<button id="CTI'+item.id+'" class="btn btn-default btnCreateTaxInvoice" style="float:right">')
                            .append("Vytvor faktúru"):'');

                    sel.append(c);

                });
                $(".btnCreateNTInvoice").on("click",function(event){
                    createInvoice(this.id.substr(3),eventId,"P",function(res,err){
                        if (err)
                            alert("Chyba pri vytváraní zálohovej faktúry.",err);
                        else
                            alert("Zálohová Faktúra bola vytvorená. Nájdete ju na stránke tímu.");
                    });
                });
                $(".btnCreateTaxInvoice").on("click",function(event){
                    createInvoice(this.id.substr(3),eventId,"I",function(res,err){
                        if (err)
                            alert("Chyba pri vytváraní zálohovej faktúry.",err);
                        else
                            alert("Zálohová Faktúra bola vytvorená. Nájdete ju na stránke tímu.");
                    });
                });
                $(".btnEditTeamNumber").on("click",function(evt){
                    let teId = evt.target.id.substr(3);
                    $("#teamEventId").val(teId);
                    $("#teamNumber").val("");
                    $("#editTeamNumber").modal();
                });


            } else {
                sel.text('Žiadne');
            }
        } else {
            console.log("loadTeams: Server returned ERROR");
        }

    });

}

function saveTeamNumber(teamEventId, teamNum, cb){
    console.log('Assigning number #'+teamNum+' to teamEvent='+teamEventId);
    $.post("/teamevent/"+teamEventId,
        {
            cmd: 'assignNumber',
            teamNumber: teamNum
        },
        function (res) {
            console.log("assignNumber: Server returned",res);
            if (res.result == "ok") {
                console.log("team number assigned", res.teamEvent.teamNumber);
                cb(res);
            } else {
                console.log("Error assigning number to team",res);
                cb(res, res.error);
            }
        }
    )
        .fail(function (err) {
            console.log("Error assigning number to a team",err);
            cb(null, err);
        });


}