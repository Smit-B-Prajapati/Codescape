import User from '../models/User.js';
import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import Activity from '../models/Activity.js';
import Expense from '../models/Expense.js';

/**
 * @route   GET /api/profile
 * @desc    Get authenticated user profile details & saved destinations
 * @access  Private
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        language: user.language || 'English',
        savedDestinations: user.savedDestinations || [],
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Get Profile Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving profile',
    });
  }
};

/**
 * @route   PUT /api/profile
 * @desc    Update user profile details (Name, Email, Profile Photo, Language)
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, profilePhoto, language } = req.body;

    // Email Validation & Duplicate Check
    if (email && email.toLowerCase() !== user.email) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email address is already in use by another account',
        });
      }

      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name.trim();
    if (profilePhoto) user.profilePhoto = profilePhoto.trim();
    if (language) user.language = language;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        language: user.language,
        savedDestinations: user.savedDestinations,
      },
    });
  } catch (error) {
    console.error('[Update Profile Error]:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile',
    });
  }
};

/**
 * @route   POST /api/profile/saved-destinations
 * @desc    Toggle add/remove saved destination
 * @access  Private
 */
export const toggleSavedDestination = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { city, country, image } = req.body;

    if (!city || !country) {
      return res.status(400).json({
        success: false,
        message: 'City and Country are required',
      });
    }

    const existingIndex = user.savedDestinations.findIndex(
      (d) => d.city.toLowerCase() === city.toLowerCase()
    );

    let isSaved = false;
    if (existingIndex >= 0) {
      // Remove
      user.savedDestinations.splice(existingIndex, 1);
      isSaved = false;
    } else {
      // Add
      user.savedDestinations.push({ city, country, image: image || '' });
      isSaved = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: isSaved ? 'Destination saved to your profile' : 'Destination removed from saved list',
      isSaved,
      savedDestinations: user.savedDestinations,
    });
  } catch (error) {
    console.error('[Toggle Saved Destination Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating saved destinations',
    });
  }
};

/**
 * @route   DELETE /api/profile/account
 * @desc    Permanently delete account and all associated trip data
 * @access  Private
 */
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Fetch user trips
    const userTrips = await Trip.find({ user: userId });
    const tripIds = userTrips.map((t) => t._id);

    // 2. Cascade delete stops, activities, and expenses
    await Expense.deleteMany({ trip: { $in: tripIds } });
    await Activity.deleteMany({ trip: { $in: tripIds } });
    await Stop.deleteMany({ trip: { $in: tripIds } });
    await Trip.deleteMany({ user: userId });

    // 3. Delete user document
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Your account and all associated trip data have been permanently deleted',
    });
  } catch (error) {
    console.error('[Delete Account Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user account',
    });
  }
};
