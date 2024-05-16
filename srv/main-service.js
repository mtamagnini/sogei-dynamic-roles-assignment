module.exports = async (srv) => {

    const wzService = await cds.connect.to('workzone-api');

    srv.on("updateUsersLists", async (req) => {
        const { userId, mainRole, subRole } = req.data;
        //const user = req.user;


        var aUsers = await wzService.send({
            method: 'GET',
            path: `/api/v1/scim/Users`
        });

        return {
            status: "succeed",
            message: "Change Done!"
        };
    });

}