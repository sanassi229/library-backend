const { query } = require('../config/database');

const getAllBanners = async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                idbanner,
                titlebanner,
                subtitlebanner,
                descriptionbanner,
                imagebanner,
                linkbanner,
                statusbanner,
                orderbanner,
                createdat
            FROM banners 
            WHERE statusbanner = 'active'
            ORDER BY orderbanner ASC, createdat DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách banner'
        });
    }
};

const getBannerById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'SELECT * FROM banners WHERE idbanner = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy banner'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get banner by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin banner'
        });
    }
};

const { uploadToImgBB } = require('../utils/imgbb');
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

const addBanner = async (req, res) => {
    try {
        const { 
            title, 
            subtitle, 
            description,
            image,
            link,
            status = 'active',
            order = 0
        } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tiêu đề banner'
            });
        }

        let imageUrl = null;
        if (image) {
            try {
                imageUrl = await uploadToImgBB(image, IMGBB_API_KEY);
            } catch (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi upload ảnh lên imgBB',
                    error: err.message
                });
            }
        }

        const result = await query(`
            INSERT INTO banners (
                titlebanner, 
                subtitlebanner, 
                descriptionbanner, 
                imagebanner, 
                linkbanner,
                statusbanner,
                orderbanner
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            title.trim(),
            subtitle?.trim() || null,
            description?.trim() || null,
            imageUrl,
            link?.trim() || null,
            status,
            parseInt(order) || 0
        ]);

        res.status(201).json({
            success: true,
            message: 'Thêm banner thành công',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Add banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thêm banner'
        });
    }
};

const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title, 
            subtitle, 
            description,
            image,
            link,
            status,
            order
        } = req.body;

        const bannerCheck = await query(
            'SELECT * FROM banners WHERE idbanner = $1',
            [id]
        );

        if (bannerCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy banner'
            });
        }

        const result = await query(`
            UPDATE banners SET 
                titlebanner = $1,
                subtitlebanner = $2,
                descriptionbanner = $3,
                imagebanner = $4,
                linkbanner = $5,
                statusbanner = $6,
                orderbanner = $7,
                updatedat = CURRENT_TIMESTAMP
            WHERE idbanner = $8
            RETURNING *
        `, [
            title?.trim() || bannerCheck.rows[0].titlebanner,
            subtitle?.trim() || bannerCheck.rows[0].subtitlebanner,
            description?.trim() || bannerCheck.rows[0].descriptionbanner,
            image?.trim() || bannerCheck.rows[0].imagebanner,
            link?.trim() || bannerCheck.rows[0].linkbanner,
            status || bannerCheck.rows[0].statusbanner,
            order !== undefined ? parseInt(order) : bannerCheck.rows[0].orderbanner,
            id
        ]);

        res.json({
            success: true,
            message: 'Cập nhật banner thành công',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Update banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật banner'
        });
    }
};

const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;

        const bannerCheck = await query(
            'SELECT * FROM banners WHERE idbanner = $1',
            [id]
        );

        if (bannerCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy banner'
            });
        }

        await query(
            'DELETE FROM banners WHERE idbanner = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Xóa banner thành công'
        });

    } catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa banner'
        });
    }
};

const updateBannerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        const bannerCheck = await query(
            'SELECT * FROM banners WHERE idbanner = $1',
            [id]
        );

        if (bannerCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy banner'
            });
        }

        const result = await query(`
            UPDATE banners SET 
                statusbanner = $1,
                updatedat = CURRENT_TIMESTAMP
            WHERE idbanner = $2
            RETURNING *
        `, [status, id]);

        res.json({
            success: true,
            message: `${status === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'} banner thành công`,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Update banner status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật trạng thái banner'
        });
    }
};

module.exports = {
    getAllBanners,
    getBannerById,
    addBanner,
    updateBanner,
    deleteBanner,
    updateBannerStatus
};