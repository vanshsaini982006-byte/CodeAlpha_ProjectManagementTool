const User = require('../models/User');

// @desc    Get own profile
// @route   GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc    Update own profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar, username } = req.body;

    if (username) {
      const taken = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.user._id } });
      if (taken) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }
      req.user.username = username.toLowerCase();
    }

    if (name !== undefined) req.user.name = name;
    if (bio !== undefined) req.user.bio = bio;
    if (avatar !== undefined) req.user.avatar = avatar;

    await req.user.save();
    res.json({ success: true, user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user by id (public profile)
// @route   GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc    Search users by name/username/email (for invite autocomplete)
// @route   GET /api/users?search=term
const searchUsers = async (req, res, next) => {
  try {
    const { search = '' } = req.query;
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};
    const users = await User.find(query).limit(10);
    res.json({ success: true, users: users.map((u) => u.toSafeObject()) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, getUserById, searchUsers };
