
const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");

const getProfile = async (req, res) => {
  try {
    const userId = req.query.id;
    if (!userId) {
      return res.redirect('/login');
    }

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(404).send("User not found");
    }

    res.render("user-profile", { user : userData , activePage : "profile"});
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading profile");
  }
};



const editProfile = async (req, res) => {
  try {
    const userId = req.session.user;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    // Extract data from request body
    const { full_name, username, email, phone } = req.body;


    // Update user information
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        full_name,
        username,
        phone,
        email,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update session with new user data
    req.session.user = updatedUser;

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



module.exports = {
    getProfile,
    editProfile
}