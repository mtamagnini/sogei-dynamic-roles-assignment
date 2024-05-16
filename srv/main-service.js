module.exports = async (srv) => {

    srv.on("updateUsersLists", async (req) => {
        const { userId, mainRole, subRole } = req.data;
        //req.user
        return {
            status: "succeed",
            message: "Change Done!"
        };
    });

}