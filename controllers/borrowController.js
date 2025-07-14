const { query } = require('../config/database');

const getAllBorrows = async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                m.idBorrow,
                m.dateBorrow,
                m.statusBorrow,
                m.idCard,
                t.nameCard,
                t.emailCard,
                l.idLibrarian,
                u.nameUser as librarianName
            FROM MUONTRA m
            LEFT JOIN THETHUVIEN t ON m.idCard = t.idCard
            LEFT JOIN THUTHU l ON m.idLibrarian = l.idLibrarian
            LEFT JOIN ACCOUNT_USER u ON l.idUser = u.idUser
            ORDER BY m.dateBorrow DESC
        `);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Get borrows error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách mượn sách'
        });
    }
};

const getBorrowById = async (req, res) => {
    try {
        const { id } = req.params;

        const borrowResult = await query(`
            SELECT 
                m.idBorrow,
                m.dateBorrow,
                m.statusBorrow,
                m.idCard,
                t.nameCard,
                t.emailCard,
                l.idLibrarian,
                u.nameUser as librarianName
            FROM MUONTRA m
            LEFT JOIN THETHUVIEN t ON m.idCard = t.idCard
            LEFT JOIN THUTHU l ON m.idLibrarian = l.idLibrarian
            LEFT JOIN ACCOUNT_USER u ON l.idUser = u.idUser
            WHERE m.idBorrow = $1
        `, [id]);

        if (borrowResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu mượn'
            });
        }

        const booksResult = await query(`
            SELECT 
                bb.idBook,
                s.nameBook,
                s.authorBook,
                bb.startDate,
                bb.returnDate,
                bb.statusBookBorrow
            FROM JOIN_BOOKBORROW bb
            LEFT JOIN SACH s ON bb.idBook = s.idBook
            WHERE bb.idBorrow = $1
        `, [id]);

        const borrowData = borrowResult.rows[0];
        borrowData.books = booksResult.rows;

        res.json({
            success: true,
            data: borrowData
        });
    } catch (error) {
        console.error('Get borrow by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin phiếu mượn'
        });
    }
};

const createBorrow = async (req, res) => {
    try {
        const { idCard, idLibrarian, books } = req.body;

        if (!idCard || !idLibrarian || !books || books.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc: idCard, idLibrarian, books'
            });
        }

        const cardCheck = await query(
            'SELECT * FROM thethuvien WHERE idcard = $1 AND statuscard = 1',
            [idCard]
        );

        if (cardCheck.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Thẻ thư viện không tồn tại hoặc không hoạt động'
            });
        }

        const librarianCheck = await query(
            'SELECT * FROM thuthu WHERE idlibrarian = $1',
            [idLibrarian]
        );

        if (librarianCheck.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Thủ thư không tồn tại'
            });
        }

        for (const bookId of books) {
            const bookCheck = await query(
                'SELECT * FROM sach WHERE idbook = $1 AND availablebook > 0',
                [bookId]
            );

            if (bookCheck.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Sách với ID ${bookId} không có sẵn để mượn`
                });
            }
        }

        const borrowResult = await query(`
            INSERT INTO muontra (idcard, idlibrarian, dateborrow, statusborrow)
            VALUES ($1, $2, CURRENT_DATE, 'ACTIVE')
            RETURNING idborrow
        `, [idCard, idLibrarian]);

        const borrowId = borrowResult.rows[0].idborrow;

        for (const bookId of books) {
            await query(`
                INSERT INTO join_bookborrow (idborrow, idbook, startdate, statusbookborrow)
                VALUES ($1, $2, CURRENT_DATE, 'BORROWED')
            `, [borrowId, bookId]);

            await query(`
                UPDATE sach 
                SET availablebook = availablebook - 1 
                WHERE idbook = $1
            `, [bookId]);
        }

        res.status(201).json({
            success: true,
            message: 'Tạo phiếu mượn thành công',
            data: { borrowId, idCard, idLibrarian, books }
        });

    } catch (error) {
        console.error('Create borrow error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo phiếu mượn'
        });
    }
};

const searchBorrows = async (req, res) => {
    try {
        const { idBorrow = '', idCard = '' } = req.query;

        let whereConditions = [];
        let params = [];
        let paramCount = 1;

        if (idBorrow) {
            whereConditions.push(`m.idborrow = $${paramCount}`);
            params.push(parseInt(idBorrow));
            paramCount++;
        }

        if (idCard) {
            whereConditions.push(`m.idcard ILIKE $${paramCount}`);
            params.push(`%${idCard}%`);
            paramCount++;
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        const result = await query(`
            SELECT 
                m.idborrow,
                m.dateborrow,
                m.statusborrow,
                m.idcard,
                t.namecard,
                t.emailcard,
                l.idlibrarian,
                u.nameuser as librarianname
            FROM muontra m
            LEFT JOIN thethuvien t ON m.idcard = t.idcard
            LEFT JOIN thuthu l ON m.idlibrarian = l.idlibrarian
            LEFT JOIN account_user u ON l.iduser = u.iduser
            ${whereClause}
            ORDER BY m.dateborrow DESC
        `, params);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Search borrows error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tìm kiếm phiếu mượn'
        });
    }
};

const updateBorrowStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái là bắt buộc'
            });
        }

        const checkBorrow = await query(
            'SELECT * FROM muontra WHERE idborrow = $1',
            [id]
        );

        if (checkBorrow.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu mượn'
            });
        }

        await query(
            'UPDATE muontra SET statusborrow = $1 WHERE idborrow = $2',
            [status, id]
        );

        if (status === 'RETURNED') {
            const borrowedBooks = await query(
                'SELECT idbook FROM join_bookborrow WHERE idborrow = $1',
                [id]
            );

            for (const book of borrowedBooks.rows) {
                await query(
                    'UPDATE sach SET availablebook = availablebook + 1 WHERE idbook = $1',
                    [book.idbook]
                );

                await query(
                    'UPDATE join_bookborrow SET statusbookborrow = $1, returndate = CURRENT_DATE WHERE idborrow = $2 AND idbook = $3',
                    ['RETURNED', id, book.idbook]
                );
            }
        }

        res.json({
            success: true,
            message: 'Cập nhật trạng thái phiếu mượn thành công'
        });

    } catch (error) {
        console.error('Update borrow status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật trạng thái phiếu mượn'
        });
    }
};

const deleteBorrow = async (req, res) => {
    try {
        const { id } = req.params;

        const checkBorrow = await query(
            'SELECT * FROM muontra WHERE idborrow = $1',
            [id]
        );

        if (checkBorrow.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiếu mượn'
            });
        }

        if (checkBorrow.rows[0].statusborrow === 'ACTIVE') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa phiếu mượn đang hoạt động. Vui lòng trả sách trước.'
            });
        }

        await query(
            'DELETE FROM join_bookborrow WHERE idborrow = $1',
            [id]
        );

        await query(
            'DELETE FROM muontra WHERE idborrow = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Xóa phiếu mượn thành công'
        });

    } catch (error) {
        console.error('Delete borrow error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa phiếu mượn'
        });
    }
};

module.exports = {
    getAllBorrows,
    getBorrowById,
    createBorrow,
    searchBorrows,
    updateBorrowStatus,
    deleteBorrow
};