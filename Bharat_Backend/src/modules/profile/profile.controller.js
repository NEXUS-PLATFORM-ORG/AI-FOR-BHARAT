import * as profileService from './profile.service.js';

export const createProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const profileData = { ...req.body, user_id: userId || req.body.user_id };
    
    if (!profileData.user_id) {
       return res.status(400).json({ message: 'User ID is required to create a profile' });
    }

    const profile = await profileService.createProfile(profileData);
    res.status(201).json({ message: 'Profile created successfully', profile });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user?.userId;
    
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const profile = await profileService.getProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user?.userId;
    const profileData = req.body;
    
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const updatedProfile = await profileService.updateProfile(userId, profileData);
    res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    next(error);
  }
};

export const deleteProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user?.userId;
    
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const deletedProfile = await profileService.deleteProfile(userId);
    res.status(200).json({ message: 'Profile deleted successfully', profile: deletedProfile });
  } catch (error) {
    next(error);
  }
};
