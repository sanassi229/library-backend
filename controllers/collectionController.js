const { query } = require('../config/database');

const getAllCollections = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM suutap ORDER BY namecollection'
        );

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Get collections error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách bộ sưu tập'
        });
    }
};

const getCollectionById = async (req, res) => {
    try {
        const { id } = req.params;

        const collectionResult = await query(
            'SELECT * FROM suutap WHERE idcollection = $1',
            [id]
        );

        if (collectionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bộ sưu tập'
            });
        }

        const booksResult = await query(`
            SELECT 
                s.idbook,
                s.titlebook as namebook,
                s.categorybook as typebook,
                s.authorbook,
                s.publisherbook,
                CASE 
                    WHEN s.availablebook > 0 THEN 'AVAILABLE'
                    ELSE 'UNAVAILABLE'
                END as statusbook
            FROM join_listcollection jlc
            LEFT JOIN sach s ON jlc.idbook = s.idbook
            WHERE jlc.idcollection = $1
        `, [id]);

        const collectionData = collectionResult.rows[0];
        collectionData.books = booksResult.rows;

        res.json({
            success: true,
            data: collectionData
        });
    } catch (error) {
        console.error('Get collection by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin bộ sưu tập'
        });
    }
};

const searchCollections = async (req, res) => {
    try {
        const { id = '', name = '' } = req.query;

        let whereConditions = [];
        let params = [];
        let paramCount = 1;

        if (id) {
            whereConditions.push(`idcollection ILIKE $${paramCount}`);
            params.push(`%${id}%`);
            paramCount++;
        }

        if (name) {
            whereConditions.push(`namecollection ILIKE $${paramCount}`);
            params.push(`%${name}%`);
            paramCount++;
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        const result = await query(`
            SELECT * FROM suutap 
            ${whereClause}
            ORDER BY namecollection
        `, params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Search collections error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tìm kiếm bộ sưu tập'
        });
    }
};

const createCollection = async (req, res) => {
    try {
        const { id, name, description, image } = req.body;

        if (!id || !name || !description) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: id, name, description'
            });
        }

        const existingCollection = await query(
            'SELECT * FROM suutap WHERE idcollection = $1',
            [id]
        );

        if (existingCollection.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'ID bộ sưu tập đã tồn tại'
            });
        }

        const imageBuffer = image ? Buffer.from(image, 'base64') : null;

        const result = await query(`
            INSERT INTO suutap (idcollection, namecollection, descriptioncollection, imagecollection)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [id, name, description, imageBuffer]);

        res.status(201).json({
            success: true,
            message: 'Tạo bộ sưu tập thành công',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create collection error:', error);
        
        if (error.code === '23505') { 
            return res.status(400).json({
                success: false,
                message: 'ID bộ sưu tập đã tồn tại'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo bộ sưu tập'
        });
    }
};

const addBookToCollection = async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { bookId } = req.body;

        if (!bookId) {
            return res.status(400).json({
                success: false,
                message: 'ID sách là bắt buộc'
            });
        }

        const checkCollection = await query(
            'SELECT * FROM suutap WHERE idcollection = $1',
            [collectionId]
        );

        if (checkCollection.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bộ sưu tập'
            });
        }

        const checkBook = await query(
            'SELECT * FROM sach WHERE idbook = $1',
            [bookId]
        );

        if (checkBook.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sách'
            });
        }

        const checkExisting = await query(
            'SELECT * FROM join_listcollection WHERE idcollection = $1 AND idbook = $2',
            [collectionId, bookId]
        );

        if (checkExisting.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Sách đã có trong bộ sưu tập này'
            });
        }

        await query(
            'INSERT INTO join_listcollection (idcollection, idbook) VALUES ($1, $2)',
            [collectionId, bookId]
        );

        res.json({
            success: true,
            message: 'Thêm sách vào bộ sưu tập thành công'
        });

    } catch (error) {
        console.error('Add book to collection error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thêm sách vào bộ sưu tập'
        });
    }
};

const removeBookFromCollection = async (req, res) => {
    try {
        const { collectionId, bookId } = req.params;

        const checkExisting = await query(
            'SELECT * FROM join_listcollection WHERE idcollection = $1 AND idbook = $2',
            [collectionId, bookId]
        );

        if (checkExisting.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sách không có trong bộ sưu tập này'
            });
        }

        await query(
            'DELETE FROM join_listcollection WHERE idcollection = $1 AND idbook = $2',
            [collectionId, bookId]
        );

        res.json({
            success: true,
            message: 'Xóa sách khỏi bộ sưu tập thành công'
        });

    } catch (error) {
        console.error('Remove book from collection error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa sách khỏi bộ sưu tập'
        });
    }
};

const deleteCollection = async (req, res) => {
    try {
        const { id } = req.params;

        const checkCollection = await query(
            'SELECT * FROM suutap WHERE idcollection = $1',
            [id]
        );

        if (checkCollection.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bộ sưu tập'
            });
        }

        await query(
            'DELETE FROM join_listcollection WHERE idcollection = $1',
            [id]
        );

        await query(
            'DELETE FROM suutap WHERE idcollection = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Xóa bộ sưu tập thành công'
        });

    } catch (error) {
        console.error('Delete collection error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa bộ sưu tập'
        });
    }
};

module.exports = {
    getAllCollections,
    getCollectionById,
    searchCollections,
    createCollection,
    addBookToCollection,
    removeBookFromCollection,
    deleteCollection
};