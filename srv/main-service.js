const { get } = require("@sap/cds");
let _ = require("lodash");

module.exports = async (srv) => {

    const {SubRole, WorkZoneGroup, SubRoleGroupRelation, User} = cds.entities("dynamic_workzone_roles");
    const wzService = await cds.connect.to('workzone-api');

    srv.on("updateUsersLists", async (req) => {
        //get all the WZG ids that are linked to the subRole selected
        const {subRoleUUID} = req.data;
        var my_subRole = await SELECT.one.from(SubRole).where({id: subRoleUUID});
        var wzGroups_to_subRole = await SELECT.from(SubRoleGroupRelation).where({subRole_id:my_subRole["id"]});
        var groups_to_be = [];
        for (var wz in wzGroups_to_subRole){
            var workZoneId = await SELECT.one.from(WorkZoneGroup).where({id: wzGroups_to_subRole[wz]["workZoneGroup_id"]});
            groups_to_be.push(workZoneId["workZoneId"]);
        }
        //get the User details from WZ
        var userId = await getUserId(req.user.id, false);
        var oUser = await restAPI('GET',`/api/v1/scim/Users/${userId}`);
        //get all the WZG ids that are currently linked to the user authenticated
        var groups_as_is = oUser["groups"].map(e => e["value"]);
        //remove from groups_as_is and groups_to_be all the elements present in both groups (the idea is that if groups_as_is already has an element of groups_to_be nothing needs to be done for that WZG)
        var usefulArr = _.difference(groups_as_is,groups_to_be);
        groups_to_be = _.difference(groups_to_be,groups_as_is);
        groups_as_is = usefulArr;
        var promises = [];
        //For each group in groups_as_is remove the authenticated user to the group
        promises = promises.concat(groups_as_is.map(group => new Promise(async (resolve, reject) => {
            var oGroup = await restAPI('GET',`/api/v1/scim/Groups/${group}?attributes=members`);
            oGroup["members"].splice(oGroup["members"].findIndex(e => e["value"] == group),1);
            await restAPI('PUT',`/api/v1/scim/Groups/${group}`,oGroup,{"Content-Type":"application/json"});
        })));
        //For each group in groups_as_is add the authenticated user to the group
        promises = promises.concat(groups_to_be.map(group => new Promise(async (resolve, reject) => {
            var oGroup = await restAPI('GET',`/api/v1/scim/Groups/${group}?attributes=members`);
            oGroup["members"].push({value:userId,type:"user"});
            await restAPI('PUT',`/api/v1/scim/Groups/${group}`,oGroup,{"Content-Type":"application/json"});
        })));
        Promise.all(promises).then((values) => {console.log(values);});
        //return a default message that signals the status has changed
        return {
            status: "succeed",
            message: "The user groups have been updated correctly!"
        };
    });

    //function to call WZ through RestAPI
    async function restAPI(method,path,data=null,headers=null){
        return await wzService.send({
            method: method,
            path: path,
            data: data,
            headers: headers
        });
    };

    //select whether to use the ID present in req.user.id or to use the ID related to the req.user.id defined in a transformation table
    async function getUserId(userId, loggedInfo){
        if(loggedInfo) return userId;
        var user = await SELECT.one.from(User).where({reqUserId: userId});
        return user["workZoneId"];
    }

}

