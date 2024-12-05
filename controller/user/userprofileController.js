
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


    const { full_name, username, phone , password , cpassword } = req.body;

 const updateData = {
  full_name,
  username,
  phone,
};


if (password && password.trim() !== "") {
  updateData.password = await bcrypt.hash(password, 10);
}


const updatedUser = await User.findByIdAndUpdate(
  userId,
  updateData,
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
    res.render('address-view',{address : addressData, addressType: addressData?.addressType, activePage : "address"})
  }catch(error){
    console.log("Error in viewing address",error)
    res.redirect('/pageerror')
  }
}


const addAddress = async(req,res)=>{
  try{

    const {recipient_name,streetAddress, city, state, landMark, pincode,phone,altPhone,addressType } = req.body;

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
    res.redirect('/pagenotfound');
  }
}


const deleteAddress = async(req,res)=>{
  try {
    const addressId = req.params.id;
    await Address.updateOne(
      { "address._id": addressId },
      { $pull: { address: { _id: addressId } } }
    );
    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete address" });
  }
}

const editAddress = async(req,res)=>{
  try {
    const address = await Address.findOne({ 'address._id': req.params.id }, { 'address.$': 1 });
    if (!address) return res.status(404).json({ message: 'Address not found' });
    res.json(address.address[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}


const updateAddress = async(req,res)=>{

  const { recipient_name, streetAddress, city, state, landMark, pincode, phone, altPhone, addressType } = req.body;

  try {
    await Address.updateOne(
      { 'address._id': req.params.id },
      {
        $set: {
          'address.$.recipient_name': recipient_name,
          'address.$.streetAddress': streetAddress,
          'address.$.city': city,
          'address.$.state': state,
          'address.$.landMark': landMark,
          'address.$.pincode': pincode,
          'address.$.phone': phone,
          'address.$.altPhone': altPhone,
          'address.$.addressType': addressType,
        },
      }
    );
    res.redirect('/address-view');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to update address');
  }

}


module.exports = {
    getProfile,
    editProfile,
    viewAddress,
    addAddress,
    deleteAddress,
    editAddress,
    updateAddress
}