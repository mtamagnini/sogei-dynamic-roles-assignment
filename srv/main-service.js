const { get } = require("@sap/cds");

module.exports = async (srv) => {

    const {SubRole, WorkZoneGroup, SubRoleGroupRelation} = cds.entities("dynamic_workzone_roles");
    const wzService = await cds.connect.to('workzone-api');

    srv.on("updateUsersLists", async (req) => {
        const { userId, subRole } = req.data;
        var my_subRole = await SELECT.one.from(SubRole).where({id: subRole});
        var wzGroups_to_subRole = await SELECT.from(SubRoleGroupRelation).where({subRole_id:my_subRole["id"]});
        var groups_to_be = [];
        for (var wz in wzGroups_to_subRole){
            var workZoneId = await SELECT.one.from(WorkZoneGroup).where({id: wzGroups_to_subRole[wz]["workZoneGroup_id"]});
            groups_to_be.push(workZoneId["workZoneId"]);
        }
        //TODO: get userId from req.user
        var oUser = await restAPI('GET',`/api/v1/scim/Users/${userId}`);
        var groups_as_is = oUser["groups"].map(e => e["value"]);
        for(var group in groups_to_be){
            if(groups_as_is.includes(groups_to_be[group])){
                groups_to_be.splice(group,1);
                groups_as_is.splice(groups_as_is.indexOf(groups_to_be[group]),1);
            }
        }
        //promise
        for(var group in groups_as_is){
            var oGroup = await restAPI('GET',`/api/v1/scim/Groups/${groups_as_is[group]}?attributes=members`);
            oGroup["members"].splice(oGroup["members"].findIndex(e => e["value"] == groups_as_is[group]),1);
            await restAPI('PUT',`/api/v1/scim/Groups/${groups_as_is[group]}`,oGroup,{"Content-Type":"application/json"})
        }
        for(var group in groups_to_be){
            var oGroup = await restAPI('GET',`/api/v1/scim/Groups/${groups_to_be[group]}?attributes=members`);
            oGroup["members"].push({value:userId,type:"user"});
            await restAPI('PUT',`/api/v1/scim/Groups/${groups_to_be[group]}`,oGroup,{"Content-Type":"application/json"})
        }
        return {
            status: "succeed",
            message: "The user groups have been updated correctly!"
        };
    });

    async function restAPI(method,path,data=null,headers=null){
        return await wzService.send({
            method: method,
            path: path,
            data: data,
            headers: headers
        });
    }

}

