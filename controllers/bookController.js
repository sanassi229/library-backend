const { query } = require('../config/database');

const getAllBooks = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', category = '', author = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (search) {
            whereClause += ` AND (titlebook ILIKE $${paramCount} OR authorbook ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        if (category) {
            whereClause += ` AND categorybook ILIKE $${paramCount}`;
            params.push(`%${category}%`);
            paramCount++;
        }

        if (author) {
            whereClause += ` AND authorbook ILIKE $${paramCount}`;
            params.push(`%${author}%`);
            paramCount++;
        }

        const countQuery = `SELECT COUNT(*) as total FROM sach ${whereClause}`;
        const countResult = await query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        const booksQuery = `
            SELECT 
                idbook,
                titlebook,
                authorbook,
                publisherbook,
                yearbook,
                isbnbook,
                categorybook,
                quantitybook,
                availablebook,
                imagebook,
                descriptionbook,
                createdat
            FROM sach 
            ${whereClause}
            ORDER BY createdat DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        
        params.push(parseInt(limit), offset);
        const booksResult = await query(booksQuery, params);

        res.json({
            success: true,
            data: {
                books: booksResult.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách sách'
        });
    }
};

const getBookById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'SELECT * FROM sach WHERE idbook = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sách'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get book by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin sách'
        });
    }
};

const addBook = async (req, res) => {
    try {
        const { 
            title, 
            author, 
            publisher, 
            year, 
            isbn, 
            category, 
            quantity, 
            description,
            image 
        } = req.body;

        if (!title || !author || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin: tên sách, tác giả, số lượng'
            });
        }

        if (isbn) {
            const isbnCheck = await query(
                'SELECT * FROM sach WHERE isbnbook = $1',
                [isbn]
            );

            if (isbnCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ISBN đã tồn tại trong hệ thống'
                });
            }
        }

        const result = await query(`
            INSERT INTO sach (
                titlebook, 
                authorbook, 
                publisherbook, 
                yearbook, 
                isbnbook, 
                categorybook, 
                quantitybook, 
                availablebook, 
                imagebook, 
                descriptionbook
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9)
            RETURNING *
        `, [
            title.trim(),
            author.trim(),
            publisher?.trim() || null,
            year || null,
            isbn?.trim() || null,
            category?.trim() || 'Khác',
            parseInt(quantity),
            image?.trim() || null,
            description?.trim() || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Thêm sách thành công',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Add book error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thêm sách'
        });
    }
};

const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title, 
            author, 
            publisher, 
            year, 
            isbn, 
            category, 
            quantity, 
            available,
            description,
            image 
        } = req.body;

        const bookCheck = await query(
            'SELECT * FROM sach WHERE idbook = $1',
            [id]
        );

        if (bookCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sách'
            });
        }

        if (isbn) {
            const isbnCheck = await query(
                'SELECT * FROM sach WHERE isbnbook = $1 AND idbook != $2',
                [isbn, id]
            );

            if (isbnCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ISBN đã tồn tại trong hệ thống'
                });
            }
        }

        const result = await query(`
            UPDATE sach SET 
                titlebook = $1,
                authorbook = $2,
                publisherbook = $3,
                yearbook = $4,
                isbnbook = $5,
                categorybook = $6,
                quantitybook = $7,
                availablebook = $8,
                imagebook = $9,
                descriptionbook = $10
            WHERE idbook = $11
            RETURNING *
        `, [
            title?.trim() || bookCheck.rows[0].titlebook,
            author?.trim() || bookCheck.rows[0].authorbook,
            publisher?.trim() || bookCheck.rows[0].publisherbook,
            year || bookCheck.rows[0].yearbook,
            isbn?.trim() || bookCheck.rows[0].isbnbook,
            category?.trim() || bookCheck.rows[0].categorybook,
            quantity !== undefined ? parseInt(quantity) : bookCheck.rows[0].quantitybook,
            available !== undefined ? parseInt(available) : bookCheck.rows[0].availablebook,
            image?.trim() || bookCheck.rows[0].imagebook,
            description?.trim() || bookCheck.rows[0].descriptionbook,
            id
        ]);

        res.json({
            success: true,
            message: 'Cập nhật sách thành công',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Update book error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật sách'
        });
    }
};

const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;

        const bookCheck = await query(
            'SELECT * FROM sach WHERE idbook = $1',
            [id]
        );

        if (bookCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sách'
            });
        }



        await query(
            'DELETE FROM sach WHERE idbook = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Xóa sách thành công'
        });

    } catch (error) {
        console.error('Delete book error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa sách'
        });
    }
};

const getCategories = async (req, res) => {
    try {
        const result = await query(`
            SELECT DISTINCT categorybook as category, COUNT(*) as count
            FROM sach 
            WHERE categorybook IS NOT NULL
            GROUP BY categorybook
            ORDER BY count DESC, categorybook ASC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh mục sách'
        });
    }
};

const searchBooks = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
            });
        }

        const searchTerm = `%${q.trim()}%`;
        
        const result = await query(`
            SELECT 
                idbook,
                titlebook,
                authorbook,
                categorybook,
                availablebook,
                imagebook
            FROM sach 
            WHERE (titlebook ILIKE $1 OR authorbook ILIKE $1 OR categorybook ILIKE $1)
            AND availablebook > 0
            ORDER BY 
                CASE 
                    WHEN titlebook ILIKE $1 THEN 1
                    WHEN authorbook ILIKE $1 THEN 2
                    ELSE 3
                END,
                titlebook ASC
            LIMIT 20
        `, [searchTerm]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Search books error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tìm kiếm sách'
        });
    }
};

const getPopularBooks = async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                idbook,
                titlebook,
                authorbook,
                categorybook,
                availablebook,
                imagebook,
                createdat
            FROM sach 
            WHERE availablebook > 0
            ORDER BY createdat DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get popular books error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy sách phổ biến'
        });
    }
};

const checkBooksAvailability = async (req, res) => {
    try {
        const { bookIds } = req.body;

        if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp danh sách ID sách'
            });
        }

        if (bookIds.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Tối đa 50 sách mỗi lần kiểm tra'
            });
        }

        const placeholders = bookIds.map((_, index) => `$${index + 1}`).join(',');
        
        const result = await query(`
            SELECT 
                idbook,
                titlebook,
                authorbook,
                availablebook,
                quantitybook,
                CASE 
                    WHEN availablebook > 0 THEN true 
                    ELSE false 
                END as is_available
            FROM sach 
            WHERE idbook IN (${placeholders})
        `, bookIds);

        const availabilityMap = {};
        result.rows.forEach(book => {
            availabilityMap[book.idbook] = {
                id: book.idbook,
                title: book.titlebook,
                author: book.authorbook,
                available: book.availablebook,
                total: book.quantitybook,
                isAvailable: book.is_available
            };
        });

        const notFound = bookIds.filter(id => !availabilityMap[id]);

        res.json({
            success: true,
            data: {
                books: availabilityMap,
                summary: {
                    total: bookIds.length,
                    available: result.rows.filter(book => book.is_available).length,
                    unavailable: result.rows.filter(book => !book.is_available).length,
                    notFound: notFound.length
                },
                notFound
            }
        });

    } catch (error) {
        console.error('Check books availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi kiểm tra tình trạng sách'
        });
    }
};

const getBulkBooks = async (req, res) => {
    try {
        const { ids } = req.query;

        if (!ids) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp danh sách ID sách (query parameter: ids=1,2,3)'
            });
        }

        const bookIds = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

        if (bookIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách ID sách không hợp lệ'
            });
        }

        if (bookIds.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Tối đa 100 sách mỗi lần'
            });
        }

        const placeholders = bookIds.map((_, index) => `$${index + 1}`).join(',');
        
        const result = await query(`
            SELECT 
                idbook,
                titlebook,
                authorbook,
                publisherbook,
                yearbook,
                isbnbook,
                categorybook,
                quantitybook,
                availablebook,
                imagebook,
                descriptionbook,
                createdat
            FROM sach 
            WHERE idbook IN (${placeholders})
            ORDER BY titlebook ASC
        `, bookIds);

        res.json({
            success: true,
            data: {
                books: result.rows,
                summary: {
                    requested: bookIds.length,
                    found: result.rows.length,
                    notFound: bookIds.length - result.rows.length
                }
            }
        });

    } catch (error) {
        console.error('Get bulk books error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin sách'
        });
    }
};


module.exports = {
    getAllBooks,
    getBookById,
    addBook,
    updateBook,
    deleteBook,
    getCategories,
    searchBooks,
    getPopularBooks,
    checkBooksAvailability,
    getBulkBooks
};