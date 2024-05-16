module.exports = async (srv) => {

    const wzService = await cds.connect.to('workzone-api');

    srv.on("updateUsersLists", async (req) => {
        const { userId, mainRole, subRole } = req.data;
        //TODO: get userId from req.user
        var oUser = await restAPI('GET',`/api/v1/scim/Users/${userId}`);
        //TODO: groups_to_be will be populated based on mainRole and subRole values
        //test_group_1: p8IlIMwC9FbwYNBmSAU000 ;; test_group_2: BnuUh0O7D8NyXSj4lEE000
        var groups_to_be = ["BnuUh0O7D8NyXSj4lEE000"];
        var groups_as_is = oUser["groups"].map(e => e["value"]);
        for(var group in groups_to_be){
            if(groups_as_is.includes(groups_to_be[group])){
                groups_to_be.splice(group,1);
                groups_as_is.splice(groups_as_is.indexOf(groups_to_be[group]),1);
            }
        }
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

