
const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema")
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




const viewAddress = async(req,res)=>{
  try{
    const addressData = await Address.find({ user_id: req.session.user });
    res.render('address-view',{address :addressData,addressType: addressData?.addressType,activePage : "address"})
  }catch(error){
    console.log("Error in viewing address",error)
    res.redirect('/pageerror')
  }
}


const addAddress = async(req,res)=>{
  try{

    const {recipient_name,streetAddress, city, state, landMark, pincode,phone,altPhone, addressType } = req.body;

    // Create a new address
    const newAddress = new Address({
      user_id: req.session.user,
      address: {
        recipient_name,
          streetAddress,
          city,
          state,
          landMark,
          pincode,
          phone,
          altPhone,
          addressType
      }
  });

  await newAddress.save();

  req.flash('success_msg', 'Address added successfully!');
  res.redirect('/address-view');

  }catch(error){
    console.error(error);
    res.status(500).send('Server Error');
  }
}


module.exports = {
    getProfile,
    editProfile,
    viewAddress,
    addAddress
}