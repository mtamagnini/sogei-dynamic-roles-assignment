import _ from "lodash";
import 'dotenv/config';

export default async (srv) => {
    const {
        BTP_USER_ORIGIN = 'sap.custom'
    } = process.env;

    const { SubRole, WorkZoneGroup, SubRoleGroupRelation, User } = cds.entities("dynamic_workzone_roles");

    srv.on("getUserDetails", async (req) => {
        return req.user.attr;
    });

    srv.on("updateUsersLists", async (req) => {

        try {

            const { subRoleId } = req.data;

            // Search user in BTP
            const userId = req.user.id,
                btpUsers = await fetchBTPUserDetails(userId),
                { resources: foundUsers } = btpUsers;

            if (!foundUsers || foundUsers.length === 0) { // User not found
                return {
                    status: "error",
                    message: `User ${userId} not found in BTP`
                };
            }

            // Retrieve BTP Shadow user ID
            const btpUserDetails = foundUsers[0],
                {
                    id: btpShadowUserId,
                    groups: btpRoleCollectionsUserIsAssignedTo
                } = btpUserDetails;

            // Fetch list of BTP roles associated to selected SubRole
            const btpRoles = await SELECT
                .from(SubRoleGroupRelation)
                .columns(
                    (wzr) => {
                        wzr("workZoneGroup_groupId")
                    }
                )
                .where({
                    subRole_id: subRoleId
                });

            let newBTPRoleCollections = btpRoles.map(
                (role) => {
                    return role.workZoneGroup_groupId;
                }
            ),
                uselessBTPRoleCollections = btpRoleCollectionsUserIsAssignedTo.map(
                    (role) => {
                        return role.value;
                    }
                );

            // Format array of roles
            const tempArray = _.difference(uselessBTPRoleCollections, newBTPRoleCollections);
            newBTPRoleCollections = _.difference(newBTPRoleCollections, uselessBTPRoleCollections);
            uselessBTPRoleCollections = tempArray;

            // Remove user from un-needed RCs in BTP
            await removeUserFromBTPRoleCollections(btpShadowUserId, uselessBTPRoleCollections);

            // Add user to newly needed RCs in BTP
            await addUserToBTPRoleCollections(btpShadowUserId, newBTPRoleCollections);

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


    /*******************************
     * ANCHOR UTIL/SUPPORT METHODS *
     *******************************/
    const _sendRequestToXSUAAAPI = async (options) => {
        const btpAuthService = await cds.connect.to('cf-uaa-api');
        return await btpAuthService.send(options);
    }

    const fetchBTPUserDetails = async (userId) => {
        const options = {
            method: "GET",
            path: `/Users?filter=userName eq '${userId}' and origin eq '${BTP_USER_ORIGIN}'`
        };
        return _sendRequestToXSUAAAPI(options)
    }

    const removeUserFromBTPRoleCollections = async (userId, roleCollections) => {
        const promises = roleCollections.map(
            (rc) => {
                return _sendRequestToXSUAAAPI({
                    method: "DELETE",
                    path: `/Groups/${rc}/members/${userId}`,
                    headers: {
                        "If-Match": new Date().getTime()
                    }
                })
            }
        );

        try {
            await Promise.all(promises);
            console.log("Removed user from old RCs");
        } catch (err) {
            console.error("Error deleting user from old RCs", err);
        }
    }

    const addUserToBTPRoleCollections = async (userId, roleCollections) => {
        const ifMatch = parseInt(`${new Date().getTime()}`.substring(8));

        const promises = roleCollections.map(
            (rc) => {
                return _sendRequestToXSUAAAPI({
                    method: "PATCH",
                    path: `/Groups/${rc}`,
                    data: {
                        members: [
                            {
                                origin: BTP_USER_ORIGIN,
                                type: "USER",
                                value: userId
                            }
                        ]
                    },
                    headers: {
                        "If-Match": ifMatch
                    }
                })
            }
        );

        try {
            await Promise.all(promises);
            console.log("Added user to new RCs");
        } catch (err) {
            console.error("Error adding user to new RCs", err);
        }
    }
}