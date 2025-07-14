const { query } = require('../config/database');

const getAllUsers = async (req, res) => {
    try {
        const result = await query(
            'SELECT iduser, nameuser, emailuser FROM account_user ORDER BY nameuser'
        );

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách người dùng'
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'SELECT iduser, nameuser, emailuser FROM account_user WHERE iduser = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin người dùng'
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        const checkUser = await query(
            'SELECT * FROM account_user WHERE iduser = $1',
            [id]
        );

        if (checkUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        if (email && email !== checkUser.rows[0].emailuser) {
            const checkEmail = await query(
                'SELECT * FROM account_user WHERE emailuser = $1 AND iduser != $2',
                [email, id]
            );

            if (checkEmail.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng'
                });
            }
        }

        let updateFields = [];
        let params = [];
        let paramCount = 1;

        if (name) {
            updateFields.push(`nameuser = $${paramCount}`);
            params.push(name);
            paramCount++;
        }
        if (email) {
            updateFields.push(`emailuser = $${paramCount}`);
            params.push(email);
            paramCount++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có trường nào để cập nhật'
            });
        }

        params.push(id);

        const updateQuery = `
            UPDATE account_user 
            SET ${updateFields.join(', ')} 
            WHERE iduser = $${paramCount}
            RETURNING iduser, nameuser, emailuser
        `;
        
        const result = await query(updateQuery, params);

        res.json({
            success: true,
            message: 'Cập nhật người dùng thành công',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật người dùng'
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const checkUser = await query(
            'SELECT * FROM account_user WHERE iduser = $1',
            [id]
        );

        if (checkUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const checkDependencies = await query(`
            SELECT 
                (SELECT COUNT(*) FROM docgia WHERE iduser = $1) as membercount,
                (SELECT COUNT(*) FROM thuthu WHERE iduser = $1) as librariancount
        `, [id]);

        const { membercount, librariancount } = checkDependencies.rows[0];

        if (membercount > 0 || librariancount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa người dùng có liên kết với thẻ thư viện hoặc là thủ thư'
            });
        }

        await query(
            'DELETE FROM account_user WHERE iduser = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Xóa người dùng thành công'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa người dùng'
        });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT 
                u.iduser,
                u.nameuser,
                u.emailuser,
                u.createdat,
                CASE 
                    WHEN th.iduser IS NOT NULL THEN 'librarian'
                    WHEN d.iduser IS NOT NULL THEN 'member'
                    ELSE 'user'
                END as userrole,
                CASE 
                    WHEN d.idcard IS NOT NULL THEN true
                    ELSE false
                END as haslibrarycard,
                d.idcard,
                t.namecard,
                t.addresscard,
                t.phonecard,
                t.startcard,
                t.expirecard,
                t.statuscard
            FROM account_user u
            LEFT JOIN docgia d ON u.iduser = d.iduser
            LEFT JOIN thuthu th ON u.iduser = th.iduser
            LEFT JOIN thethuvien t ON d.idcard = t.idcard
            WHERE u.iduser = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const user = result.rows[0];

        const userProfile = {
            id: user.iduser,
            name: user.nameuser,
            email: user.emailuser,
            role: user.userrole,
            hasLibraryCard: user.haslibrarycard,
            createdAt: user.createdat,
            libraryCard: user.idcard ? {
                cardId: user.idcard,
                name: user.namecard,
                address: user.addresscard,
                phone: user.phonecard,
                memberSince: user.startcard,
                cardExpiry: user.expirecard,
                cardStatus: user.statuscard
            } : null
        };

        res.json({
            success: true,
            data: userProfile
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin hồ sơ người dùng'
        });
    }
};

const searchUsers = async (req, res) => {
    try {
        const { name = '', email = '', role = '' } = req.query;

        let whereConditions = [];
        let params = [];
        let paramCount = 1;

        if (name) {
            whereConditions.push(`u.nameuser ILIKE $${paramCount}`);
            params.push(`%${name}%`);
            paramCount++;
        }

        if (email) {
            whereConditions.push(`u.emailuser ILIKE $${paramCount}`);
            params.push(`%${email}%`);
            paramCount++;
        }

        let roleCondition = '';
        if (role) {
            if (role === 'librarian') {
                roleCondition = ' AND th.iduser IS NOT NULL';
            } else if (role === 'member') {
                roleCondition = ' AND d.iduser IS NOT NULL AND th.iduser IS NULL';
            } else if (role === 'user') {
                roleCondition = ' AND d.iduser IS NULL AND th.iduser IS NULL';
            }
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        const result = await query(`
            SELECT 
                u.iduser,
                u.nameuser,
                u.emailuser,
                u.createdat,
                CASE 
                    WHEN th.iduser IS NOT NULL THEN 'librarian'
                    WHEN d.iduser IS NOT NULL THEN 'member'
                    ELSE 'user'
                END as userrole,
                CASE 
                    WHEN d.idcard IS NOT NULL THEN true
                    ELSE false
                END as haslibrarycard
            FROM account_user u
            LEFT JOIN docgia d ON u.iduser = d.iduser
            LEFT JOIN thuthu th ON u.iduser = th.iduser
            ${whereClause}${roleCondition}
            ORDER BY u.nameuser
        `, params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tìm kiếm người dùng'
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserProfile,
    searchUsers
};