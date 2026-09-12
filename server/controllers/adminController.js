import User from '../models/User.js';
import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import Activity from '../models/Activity.js';

/**
 * @route   GET /api/admin/analytics
 * @desc    Get system-wide platform analytics, stats, aggregations, and user roster
 * @access  Private (Admin Only)
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    // 1. High-level metric counts
    const totalUsers = await User.countDocuments();
    const totalTrips = await Trip.countDocuments();
    const totalPublicTrips = await Trip.countDocuments({ isPublic: true });
    const totalActivities = await Activity.countDocuments();

    // 2. Aggregate Popular Cities
    const popularCities = await Stop.aggregate([
      {
        $group: {
          _id: { city: '$city', country: '$country' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
      {
        $project: {
          _id: 0,
          city: '$_id.city',
          country: '$_id.country',
          count: 1,
        },
      },
    ]);

    // 3. Aggregate Popular Activity Categories
    const popularCategories = await Activity.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1,
          totalCost: 1,
        },
      },
    ]);

    // 4. User roster with trip counts
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();

    const userRoster = await Promise.all(
      users.map(async (u) => {
        const tripCount = await Trip.countDocuments({ user: u._id });
        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          role: u.role || 'user',
          createdAt: u.createdAt,
          tripCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalTrips,
        totalPublicTrips,
        totalActivities,
      },
      popularCities,
      popularCategories,
      userRoster,
    });
  } catch (error) {
    console.error('[Admin Analytics Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error generating admin analytics',
    });
  }
};

/**
 * @route   PUT /api/admin/users/:userId/role
 * @desc    Toggle or update user account role (user / admin)
 * @access  Private (Admin Only)
 */
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[Update User Role Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating user role',
    });
  }
};
