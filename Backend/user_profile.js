const conn = require("../connection");

exports.user_profile =  (req, res) => {
    if (!req.session.user) {
        return res.redirect("/"); // Redirect to login if session doesn't exist
    }

    // res.json(req.session.user);

    const user = req.session.user; // Retrieve user info from session
    return res.render("user_profile", {
        name: user.name,
        email: user.email,
        usn: user.usn,
        phno : user.phno,
        dob: user.dob,
    });
    
};