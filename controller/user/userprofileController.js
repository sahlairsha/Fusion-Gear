
const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const bcrypt = require("bcrypt");

const getProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.redirect('/login');
    }

    const userData = await User.findById(userId);
    if (!userData) {
      req.flash('error',"User not found")
      return res.redirect('/userProfile')
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



const updatedUser = await User.findByIdAndUpdate(
  userId,
  updateData,
  { new: true }
);

if (!updatedUser) {
  return res.status(404).json({ success: false, message: 'User not found' });
}

    req.session.user = updatedUser;

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const resetPassword =  async(req,res)=>{

const { password, confirm_password } = req.body;
    

try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    const user = await User.findById(req.session.user);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
    }
    if (password!== confirm_password) {
        return res.status(400).json({ success: false, message: "Passwords do not match." });
    }


    user.password = hashedPassword;
    await user.save();
res.status(200).json({ success: true, message: "Password updated successfully." });
} catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ success: false, message: "An error occurred while updating the password." });
}

}


const viewAddress = async(req,res)=>{
  try{
    const user = req.session.user ? await User.findById(req.session.user) : null
    const addressData = await Address.find({ user_id: req.session.user });
    res.render('address-view',{user, address : addressData, addressType: addressData?.addressType, activePage : "address"})
  }catch(error){
    console.log("Error in viewing address",error)
    res.redirect('/pageerror')
  }
}


const addAddress = async (req, res) => {
  const userId = req.session.user;
    const { recipient_name, streetAddress, city, state, landmark, pincode, addressType, phone, altPhone } = req.body;

    try {
        const newAddress = {
            recipient_name,
            streetAddress,
            city,
            state,
            landmark,
            pincode,
            addressType,
            phone,
            altPhone
        };

       
        const updatedAddress = await Address.findOneAndUpdate(
            { user_id: userId }, 
            { $push: { address: newAddress } },
            { new: true, upsert: true } 
        );

        if (!updatedAddress) {
            return res.status(404).json({ message: 'Address is not added.' });
        }

        res.json({ message: 'Address added successfully!',updatedAddress });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};



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
    res.status(200).json({message : "Address Updated Successfully" })
  } catch (error) {
    console.error(error);
    res.status(500).json({message:'Failed to update address'});
  }

}



const refferalPage = async(req,res)=>{
  try {
    const userId = req.session.user
    if (!userId) {
      return res.redirect('/login');
    }

    const user= await User.findById(userId);
    if (!user) {
      req.flash('error',"User not found")
      return res.redirect('/userProfile')
    }
    res.render('referral',{ user ,activePage : 'referral'})
  } catch (error) {
    console.log(error);
    res.redirect('/pagenotfound')
  }
}

module.exports = {
    getProfile,
    editProfile,
    viewAddress,
    addAddress,
    deleteAddress,
    editAddress,
    updateAddress,
    resetPassword,
    refferalPage,
 };
