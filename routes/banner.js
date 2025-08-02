const express = require('express');
const {
    getAllBanners,
    getBannerById,
    addBanner,
    updateBanner,
    deleteBanner,
    updateBannerStatus
} = require('../controllers/bannerController');
const { authenticateToken, optionalAuth, requireAdminOrLibrarian } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllBanners);
router.get('/:id', getBannerById);
router.post('/', authenticateToken, requireAdminOrLibrarian, addBanner);
router.put('/:id', authenticateToken, requireAdminOrLibrarian, updateBanner);
router.patch('/:id/status', authenticateToken, requireAdminOrLibrarian, updateBannerStatus);
router.delete('/:id', authenticateToken, requireAdminOrLibrarian, deleteBanner);

module.exports = router;
