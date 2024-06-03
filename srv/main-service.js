const { get } = require("@sap/cds");
let _ = require("lodash");

module.exports = async (srv) => {

    const GOOGLE_CLOUD_USERS_LIST = "nThKJdAe7V4oFMXRyg609E";

    const { SubRole, WorkZoneGroup, SubRoleGroupRelation, User } = cds.entities("dynamic_workzone_roles");
    const wzService = await cds.connect.to('workzone-api');

    srv.on("testicolo", async (req) => {

        try {

            // Get params
            const { userId: userUuid, subRoleUuid } = req.data;

            // Fetch subRoleDetails
            const subRoleDetails = await SELECT
                .one
                .from(SubRole)
                .columns(
                    (subRole) => {
                        subRole.groups(
                            (groups) => {
                                groups.workZoneGroup(
                                    (wzg) => {
                                        wzg("workZoneId")
                                    }
                                )
                            }
                        )
                    }
                );
            const { groups } = subRoleDetails,
                wzGroupsIDs = groups.map( // NOTE: Not used here, just for reference
                    (g) => {
                        return g.workZoneGroup.workZoneId;
                    }
                );

            // Fetch user details from SCIM API
            const userDetails = await restAPI({
                method: 'GET',
                path: `/api/v1/scim/Users?filter=userName eq "${userUuid}"`
            }); // returns an array of Users

            // check if retrieved user is ok
            const { Resources } = userDetails,
                theUser = Resources[0];

            if (!theUser) {
                // TODO: rimettere a posto
                return "Hai perso!";
            }

            // Trigger test case
            await Promise.all([
                testTheCase("QeLWB2L1issdJBOOQjv09E"), // Marco Tamagnini
                testTheCase("dfY6dM7AmOXLfw7RRR809E", true) // Google Test User
            ]);

            /*
                Fracca: BIQv6ECS5DTX6AgnOAZ09E
                Rusconi: xTFBO7r7daCv9ZuDziY09E
            */

            const googleCloudUsersList = await restAPI({
                    method: 'GET',
                    path: `/api/v1/scim/Groups/${GOOGLE_CLOUD_USERS_LIST}?attributes=members`
                }),
                { members: googleCloudUsersListMembers } = googleCloudUsersList; // returns an array of Users

            console.log("Minchia (2) ho finito per davvero!");

            return {
                status: "succeed",
                message: googleCloudUsersListMembers
            };

        } catch (err) {
            console.error("Error while performing testicolo", err);
            return {
                status: "failed",
                message: err.message
            };
        }
    })

    const testTheCase = async (userId, wait = false) => {

        return new Promise(
            async (resolve, reject) => {

                try {

                    // Fetch group users list
                    const googleCloudUsersList = await restAPI({
                            method: 'GET',
                            path: `/api/v1/scim/Groups/${GOOGLE_CLOUD_USERS_LIST}?attributes=members`
                        }),
                        { members: googleCloudUsersListMembers } = googleCloudUsersList; // returns an array of Users

                    // Remove member from the list
                    _.remove(googleCloudUsersListMembers, (m) => {
                        return m.value === userId;
                    });


                    // Perform PATCHes to update members list
                    const removePayload = {
                        schemas: [
                            "urn:ietf:params:scim:schemas:core:2.0:Group",
                            "urn:ietf:params:scim:api:messages:2.0:PatchOp"
                        ],
                        Operations: [
                            {
                                op: "remove",
                                path: "members"
                            }
                        ]
                    };

                    if (wait) {
                        console.log(`[${userId} Aspetta`);
                        await new Promise(r => setTimeout(r, 1000)); // wait 
                        console.log(`[${userId} Ha finito di aspettare`);
                    }
                    const removeMembersAPICall = await restAPI({
                        method: 'PATCH',
                        path: `/api/v1/scim/Groups/${GOOGLE_CLOUD_USERS_LIST}`,
                        data: removePayload
                    });
                    console.log(`[${userId}] - removed members from GCloud UsersList`, removeMembersAPICall);

                    const updatePayload = {
                        schemas: [
                            "urn:ietf:params:scim:schemas:core:2.0:Group",
                            "urn:ietf:params:scim:api:messages:2.0:PatchOp"
                        ],
                        Operations: [
                            {
                                op: "add",
                                value: {
                                    members: googleCloudUsersListMembers
                                }
                            }
                        ]
                    };
                    const updateMembersAPICall = await restAPI(
                        {
                            method: 'PATCH',
                            path: `/api/v1/scim/Groups/${GOOGLE_CLOUD_USERS_LIST}`,
                            data: updatePayload
                        });
                    console.log(`[${userId}] - updated members from GCloud UsersList`, updateMembersAPICall);

                    resolve(`Minchia ho fatto per ${userId}`);

                } catch (err) {
                    console.error("Error while performing testicolo | testTheCase", err);
                    reject(err);
                }
            }
        )

    }

    srv.on("updateUsersLists", async (req) => {

        try {
            //get all the WZG ids that are linked to the subRole selected
            const { subRoleUUID } = req.data;
            var my_subRole = await SELECT.one.from(SubRole).where({ id: subRoleUUID });
            var wzGroups_to_subRole = await SELECT.from(SubRoleGroupRelation).where({ subRole_id: my_subRole["id"] });
            var groups_to_be = [];
            for (var wz in wzGroups_to_subRole) {
                var workZoneId = await SELECT.one.from(WorkZoneGroup).where({ id: wzGroups_to_subRole[wz]["workZoneGroup_id"] });
                groups_to_be.push(workZoneId["workZoneId"]);
            }
            //get the User details from WZ
            var userId = await getUserId(req.user.id, true);
            // var userDetails = await restAPI('GET', `/api/v1/scim/Users/${userId}`);
            var userDetails = await restAPI('GET', `/api/v1/scim/Users?filter=userName eq "${userId}"`); // returns an array of Users

            // check if retrieved user is ok
            const { Resources } = userDetails,
                theUser = Resources[0];

            if (!theUser) {
                // TODO: rimettere a posto
                return "";
            }

            //get all the WZG ids that are currently linked to the user authenticated
            var groups_as_is = theUser.groups.map(e => e["value"]);
            //remove from groups_as_is and groups_to_be all the elements present in both groups (the idea is that if groups_as_is already has an element of groups_to_be nothing needs to be done for that WZG)
            var usefulArr = _.difference(groups_as_is, groups_to_be);
            groups_to_be = _.difference(groups_to_be, groups_as_is);
            groups_as_is = usefulArr;
            var promises = [];
            //For each group in groups_as_is remove the authenticated user to the group
            promises = promises.concat(groups_as_is.map(group => new Promise(async (resolve, reject) => {
                var oGroup = await restAPI('GET', `/api/v1/scim/Groups/${group}?attributes=members`);
                oGroup["members"].splice(oGroup["members"].findIndex(e => e["value"] == group), 1);
                await restAPI('PUT', `/api/v1/scim/Groups/${group}`, oGroup, { "Content-Type": "application/json" });
            })));
            //For each group in groups_as_is add the authenticated user to the group
            promises = promises.concat(groups_to_be.map(group => new Promise(async (resolve, reject) => {
                var oGroup = await restAPI('GET', `/api/v1/scim/Groups/${group}?attributes=members`);
                oGroup["members"].push({ value: userId, type: "user" });
                await restAPI('PUT', `/api/v1/scim/Groups/${group}`, oGroup, { "Content-Type": "application/json" });
            })));

            const returnValues = await Promise.all(promises) // TODO: risistemare nome var
            console.log(returnValues);

            //return a default message that signals the status has changed
            return {
                status: "succeed",
                message: "The user groups have been updated correctly!"
            };
        } catch (err) {
            console.error("error while setting groups of user", err);
            return {
                status: "error",
                message: `Error while setting groups for the user: ${err.message || "generic error 42"}`
            };
        }
    });

    //function to call WZ through RestAPI
    // async function restAPI(method, path, data = null, headers = null) {
    async function restAPI(options) {
        const {
            method,
            path,
            data = null,
            headers = null
        } = options;
        return await wzService.send({
            method: method,
            path: path,
            data: data,
            headers: headers
        });
    };

    //select whether to use the ID present in req.user.id or to use the ID related to the req.user.id defined in a transformation table
    async function getUserId(userId, loggedInfo) {
        if (loggedInfo) return userId;
        var user = await SELECT.one.from(User).where({ reqUserId: userId });
        return user["workZoneId"];
    }

}

