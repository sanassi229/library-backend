const { query } = require('../config/database');
const nodemailer = require('nodemailer');

const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendBorrowConfirmationEmail = async (userEmail, userName, borrowData) => {
    try {
        const booksList = borrowData.books.map(book => 
            `<li style="margin: 8px 0;">
                <strong>${book.titlebook}</strong><br>
                <small style="color: #666;">Tác giả: ${book.authorbook}</small>
            </li>`
        ).join('');

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: userEmail,
            subject: '📚 Xác nhận mượn sách thành công',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #2c5aa0; text-align: center; margin-bottom: 30px;">
                            📚 Xác nhận mượn sách thành công!
                        </h2>
                        
                        <p style="font-size: 16px;">Xin chào <strong style="color: #2c5aa0;">${userName}</strong>,</p>
                        
                        <p style="color: #444; line-height: 1.6;">
                            Bạn đã mượn sách thành công! Dưới đây là thông tin chi tiết:
                        </p>

                        <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2c5aa0;">
                            <h3 style="color: #2c5aa0; margin-top: 0; margin-bottom: 15px;">
                                📋 Thông tin phiếu mượn
                            </h3>
                            <p style="margin: 8px 0;"><strong>Mã phiếu mượn:</strong> <span style="color: #d32f2f; font-weight: bold;">#${borrowData.borrowId}</span></p>
                            <p style="margin: 8px 0;"><strong>Ngày mượn:</strong> ${borrowData.borrowDate}</p>
                            <p style="margin: 8px 0;"><strong>Hạn trả:</strong> <span style="color: #ff9800; font-weight: bold;">${borrowData.dueDate}</span></p>
                            <p style="margin: 8px 0;"><strong>Số lượng sách:</strong> ${borrowData.totalBooks} cuốn</p>
                        </div>

                        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                            <h3 style="color: #e65100; margin-top: 0; margin-bottom: 15px;">
                                📖 Danh sách sách mượn
                            </h3>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                ${booksList}
                            </ul>
                        </div>

                        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                            <h3 style="color: #2e7d32; margin-top: 0; margin-bottom: 15px;">
                                ⚠️ Lưu ý quan trọng
                            </h3>
                            <ul style="color: #444; line-height: 1.6; margin: 0; padding-left: 20px;">
                                <li>Vui lòng trả sách đúng hạn để tránh phí phạt</li>
                                <li>Giữ gìn sách cẩn thận, tránh làm hỏng hoặc mất sách</li>
                                <li>Có thể gia hạn sách tối đa 2 lần (mỗi lần 15 ngày)</li>
                                <li>Liên hệ thủ thư nếu cần hỗ trợ: library@example.com</li>
                            </ul>
                        </div>

                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
                            <p style="color: #666; margin: 5px 0;">Cảm ơn bạn đã sử dụng dịch vụ thư viện!</p>
                            <p style="color: #2c5aa0; font-weight: bold; margin: 5px 0;">📚 Thư viện trực tuyến</p>
                            <p style="color: #999; font-size: 12px; margin: 5px 0;">
                                Email này được gửi tự động, vui lòng không trả lời.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        await emailTransporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Send borrow confirmation email error:', error);
        return false;
    }
};

const sendRenewalConfirmationEmail = async (userEmail, userName, renewalData) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: userEmail,
            subject: '📚 Xác nhận gia hạn sách thành công',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #2c5aa0; text-align: center; margin-bottom: 30px;">
                            📚 Gia hạn sách thành công!
                        </h2>
                        
                        <p style="font-size: 16px;">Xin chào <strong style="color: #2c5aa0;">${userName}</strong>,</p>
                        
                        <p style="color: #444; line-height: 1.6;">
                            Bạn đã gia hạn sách thành công! Dưới đây là thông tin chi tiết:
                        </p>

                        <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2c5aa0;">
                            <h3 style="color: #2c5aa0; margin-top: 0; margin-bottom: 15px;">
                                📖 Thông tin gia hạn
                            </h3>
                            <p style="margin: 8px 0;"><strong>Tên sách:</strong> ${renewalData.bookTitle}</p>
                            <p style="margin: 8px 0;"><strong>Tác giả:</strong> ${renewalData.bookAuthor}</p>
                            <p style="margin: 8px 0;"><strong>Gia hạn thêm:</strong> <span style="color: #4caf50; font-weight: bold;">${renewalData.renewedDays} ngày</span></p>
                            <p style="margin: 8px 0;"><strong>Hạn trả cũ:</strong> ${new Date(renewalData.oldDueDate).toLocaleDateString('vi-VN')}</p>
                            <p style="margin: 8px 0;"><strong>Hạn trả mới:</strong> <span style="color: #ff9800; font-weight: bold;">${new Date(renewalData.newDueDate).toLocaleDateString('vi-VN')}</span></p>
                            <p style="margin: 8px 0;"><strong>Số lần gia hạn:</strong> ${renewalData.renewCount}/2</p>
                        </div>

                        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                            <h3 style="color: #e65100; margin-top: 0; margin-bottom: 15px;">
                                ⚠️ Lưu ý quan trọng
                            </h3>
                            <ul style="color: #444; line-height: 1.6; margin: 0; padding-left: 20px;">
                                <li>Vui lòng trả sách đúng hạn mới để tránh phí phạt</li>
                                <li>Bạn còn có thể gia hạn ${2 - renewalData.renewCount} lần nữa</li>
                                <li>Không thể gia hạn sách đã quá hạn</li>
                                <li>Liên hệ thủ thư nếu cần hỗ trợ: library@example.com</li>
                            </ul>
                        </div>

                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
                            <p style="color: #666; margin: 5px 0;">Cảm ơn bạn đã sử dụng dịch vụ thư viện!</p>
                            <p style="color: #2c5aa0; font-weight: bold; margin: 5px 0;">📚 Thư viện trực tuyến</p>
                        </div>
                    </div>
                </div>
            `
        };

        await emailTransporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Send renewal confirmation email error:', error);
        return false;
    }
};

const borrowBooks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bookIds } = req.body;

        console.log('Debug - userId:', userId);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác định được người dùng. Vui lòng đăng nhập lại.'
            });
        }

        if (!bookIds || bookIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ít nhất một cuốn sách để mượn'
            });
        }

        const userResult = await query(`
            SELECT emailuser FROM account_user WHERE iduser = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        const userEmail = userResult.rows[0].emailuser;

        const cardCheck = await query(`
            SELECT * FROM thethuvien 
            WHERE emailcard = $1 AND statuscard = 1
        `, [userEmail]);

        if (cardCheck.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bạn chưa có thẻ thư viện hoặc thẻ đã bị khóa. Vui lòng liên hệ thủ thư để đăng ký thẻ.'
            });
        }

        const libraryCard = cardCheck.rows[0];
        console.log('Found library card:', libraryCard.idcard);

        const currentBorrows = await query(`
            SELECT COUNT(*) as count
            FROM borrow_records br
            JOIN borrow_book_details bbd ON br.idborrow = bbd.idborrow
            WHERE br.idcard = $1 AND bbd.statusbook = 'BORROWED'
        `, [libraryCard.idcard]);

        const currentCount = parseInt(currentBorrows.rows[0].count);
        const maxBooksAllowed = 5;

        if (currentCount + bookIds.length > maxBooksAllowed) {
            return res.status(400).json({
                success: false,
                message: `Bạn chỉ có thể mượn tối đa ${maxBooksAllowed} cuốn sách. Hiện tại đang mượn ${currentCount} cuốn.`
            });
        }

        const unavailableBooks = [];
        for (const bookId of bookIds) {
            const bookCheck = await query(
                'SELECT idbook, titlebook, availablebook FROM sach WHERE idbook = $1',
                [bookId]
            );

            if (bookCheck.rows.length === 0) {
                unavailableBooks.push(`Sách ID ${bookId} không tồn tại`);
            } else if (bookCheck.rows[0].availablebook <= 0) {
                unavailableBooks.push(`"${bookCheck.rows[0].titlebook}" đã hết sách`);
            }
        }

        if (unavailableBooks.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Một số sách không thể mượn: ' + unavailableBooks.join(', ')
            });
        }

        const borrowResult = await query(`
            INSERT INTO borrow_records (idcard, dateborrow, statusborrow)
            VALUES ($1, CURRENT_DATE, 'ACTIVE')
            RETURNING idborrow
        `, [libraryCard.idcard]);

        const borrowId = borrowResult.rows[0].idborrow;

        const borrowedBooks = [];
        for (const bookId of bookIds) {
            await query(`
                INSERT INTO borrow_book_details (idborrow, idbook, startdate, duedate, statusbook)
                VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + interval '30 days', 'BORROWED')
            `, [borrowId, bookId]);

            await query(`
                UPDATE sach 
                SET availablebook = availablebook - 1 
                WHERE idbook = $1
            `, [bookId]);

            const bookInfo = await query(
                'SELECT idbook, titlebook, authorbook, imagebook FROM sach WHERE idbook = $1',
                [bookId]
            );
            borrowedBooks.push(bookInfo.rows[0]);
        }

        res.status(201).json({
            success: true,
            message: 'Mượn sách thành công',
            data: {
                borrowId,
                borrowDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                totalBooks: bookIds.length,
                books: borrowedBooks,
                libraryCard: {
                    cardId: libraryCard.idcard,
                    cardName: libraryCard.namecard
                }
            }
        });

        const emailData = {
            borrowId,
            borrowDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            totalBooks: bookIds.length,
            books: borrowedBooks
        };

        sendBorrowConfirmationEmail(userEmail, libraryCard.namecard, emailData)
            .then(emailSent => {
                if (emailSent) {
                    console.log('Email xác nhận mượn sách đã được gửi đến:', userEmail);
                } else {
                    console.log('Không thể gửi email xác nhận mượn sách đến:', userEmail);
                }
            })
            .catch(err => {
                console.error('Email sending error:', err);
            });

    } catch (error) {
        console.error('User borrow books error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi mượn sách',
            debug: error.message
        });
    }
};

const getMyBorrows = async (req, res) => {
    try {
        const userId = req.user.userId;

        const userResult = await query(`
            SELECT emailuser FROM account_user WHERE iduser = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        const userEmail = userResult.rows[0].emailuser;

        const result = await query(`
            SELECT 
                br.idborrow,
                br.dateborrow,
                br.statusborrow,
                bbd.id as detail_id,
                bbd.idbook,
                s.titlebook,
                s.authorbook,
                s.imagebook,
                bbd.startdate,
                bbd.duedate,
                bbd.returndate,
                bbd.statusbook,
                bbd.renewcount,
                CURRENT_DATE - bbd.startdate as days_borrowed,
                CASE 
                    WHEN bbd.statusbook = 'BORROWED' AND CURRENT_DATE > bbd.duedate
                    THEN true 
                    ELSE false 
                END as is_overdue,
                CASE 
                    WHEN bbd.statusbook = 'BORROWED' AND bbd.duedate >= CURRENT_DATE
                    THEN bbd.duedate - CURRENT_DATE
                    ELSE 0
                END as days_until_due
            FROM borrow_records br
            JOIN thethuvien t ON br.idcard = t.idcard
            JOIN borrow_book_details bbd ON br.idborrow = bbd.idborrow
            JOIN sach s ON bbd.idbook = s.idbook
            WHERE t.emailcard = $1
            ORDER BY br.dateborrow DESC, bbd.startdate DESC
        `, [userEmail]);

        const borrowsMap = {};
        result.rows.forEach(row => {
            if (!borrowsMap[row.idborrow]) {
                borrowsMap[row.idborrow] = {
                    borrowId: row.idborrow,
                    borrowDate: row.dateborrow,
                    status: row.statusborrow,
                    books: []
                };
            }
            
            borrowsMap[row.idborrow].books.push({
                detailId: row.detail_id,
                bookId: row.idbook,
                title: row.titlebook,
                author: row.authorbook,
                image: row.imagebook,
                startDate: row.startdate,
                dueDate: row.duedate,
                returnDate: row.returndate,
                status: row.statusbook,
                renewCount: row.renewcount,
                daysBorrowed: row.days_borrowed,
                isOverdue: row.is_overdue,
                daysUntilDue: row.days_until_due
            });
        });

        const borrows = Object.values(borrowsMap);

        res.json({
            success: true,
            data: borrows,
            summary: {
                totalBorrows: borrows.length,
                activeBorrows: borrows.filter(b => b.status === 'ACTIVE').length,
                totalBooks: result.rows.length,
                activeBooks: result.rows.filter(r => r.statusbook === 'BORROWED').length,
                overdueBooks: result.rows.filter(r => r.is_overdue).length
            }
        });

    } catch (error) {
        console.error('Get my borrows error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách sách đang mượn'
        });
    }
};

const renewBook = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { borrowId, bookId } = req.params;
        const { renewDays = 15 } = req.body;

        const userResult = await query(`
            SELECT emailuser FROM account_user WHERE iduser = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        const userEmail = userResult.rows[0].emailuser;

        const borrowCheck = await query(`
            SELECT bbd.*, br.statusborrow, t.namecard
            FROM borrow_book_details bbd
            JOIN borrow_records br ON bbd.idborrow = br.idborrow
            JOIN thethuvien t ON br.idcard = t.idcard
            WHERE bbd.idborrow = $1 AND bbd.idbook = $2 AND t.emailcard = $3
        `, [borrowId, bookId, userEmail]);

        if (borrowCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sách trong phiếu mượn của bạn'
            });
        }

        const bookBorrow = borrowCheck.rows[0];

        if (bookBorrow.statusbook !== 'BORROWED') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể gia hạn sách đang được mượn'
            });
        }

        if (bookBorrow.renewcount >= 2) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã gia hạn sách này tối đa số lần cho phép (2 lần)'
            });
        }

        const currentDate = new Date();
        const dueDate = new Date(bookBorrow.duedate);
        if (currentDate > dueDate) {
            return res.status(400).json({
                success: false,
                message: 'Không thể gia hạn sách đã quá hạn. Vui lòng trả sách và liên hệ thủ thư.'
            });
        }

        const newDueDate = new Date(dueDate);
        newDueDate.setDate(newDueDate.getDate() + renewDays);

        await query(`
            UPDATE borrow_book_details 
            SET duedate = $1, renewcount = renewcount + 1, updatedat = CURRENT_TIMESTAMP
            WHERE idborrow = $2 AND idbook = $3
        `, [newDueDate.toISOString().split('T')[0], borrowId, bookId]);

        await query(`
            INSERT INTO book_renewals (borrow_detail_id, renewed_date, renewed_days, old_due_date, new_due_date, performed_by)
            VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
        `, [
            bookBorrow.id, 
            renewDays, 
            bookBorrow.duedate, 
            newDueDate.toISOString().split('T')[0], 
            userId
        ]);

        const bookInfo = await query(
            'SELECT titlebook, authorbook FROM sach WHERE idbook = $1',
            [bookId]
        );

        res.json({
            success: true,
            message: `Gia hạn sách thành công thêm ${renewDays} ngày`,
            data: {
                borrowId,
                bookId,
                renewedDays: renewDays,  
                renewedDate: new Date().toISOString().split('T')[0],
                oldDueDate: bookBorrow.duedate,
                newDueDate: newDueDate.toISOString().split('T')[0],
                renewCount: bookBorrow.renewcount + 1,
                maxRenewals: 2
            }
        });

        if (bookInfo.rows.length > 0) {
            const book = bookInfo.rows[0];
            
            sendRenewalConfirmationEmail(userEmail, bookBorrow.namecard, {
                bookTitle: book.titlebook,
                bookAuthor: book.authorbook,
                renewedDays: renewDays, 
                oldDueDate: bookBorrow.duedate,
                newDueDate: newDueDate.toISOString().split('T')[0],
                renewCount: bookBorrow.renewcount + 1
            }).catch(err => console.error('Email sending error:', err));
        }

    } catch (error) {
        console.error('Renew book error:', error);
        
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi gia hạn sách'
            });
        }
    }
};

const getBorrowHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        const userResult = await query(`
            SELECT emailuser FROM account_user WHERE iduser = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        const userEmail = userResult.rows[0].emailuser;

        let whereClause = 'WHERE t.emailcard = $1';
        let params = [userEmail];
        let paramCount = 2;

        if (status) {
            whereClause += ` AND bbd.statusbook = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        const countQuery = `
            SELECT COUNT(*) as total
            FROM borrow_records br
            JOIN thethuvien t ON br.idcard = t.idcard
            JOIN borrow_book_details bbd ON br.idborrow = bbd.idborrow
            ${whereClause}
        `;
        const countResult = await query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        const historyQuery = `
            SELECT 
                br.idborrow,
                br.dateborrow,
                br.statusborrow,
                bbd.id as detail_id,
                bbd.idbook,
                s.titlebook,
                s.authorbook,
                s.imagebook,
                s.categorybook,
                bbd.startdate,
                bbd.duedate,
                bbd.returndate,
                bbd.statusbook,
                bbd.renewcount,
                CURRENT_DATE - bbd.startdate as days_borrowed,
                CASE 
                    WHEN bbd.statusbook = 'BORROWED' AND CURRENT_DATE > bbd.duedate
                    THEN true 
                    ELSE false 
                END as is_overdue
            FROM borrow_records br
            JOIN thethuvien t ON br.idcard = t.idcard
            JOIN borrow_book_details bbd ON br.idborrow = bbd.idborrow
            JOIN sach s ON bbd.idbook = s.idbook
            ${whereClause}
            ORDER BY br.dateborrow DESC, bbd.startdate DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        
        params.push(parseInt(limit), offset);
        const result = await query(historyQuery, params);

        res.json({
            success: true,
            data: {
                history: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get borrow history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy lịch sử mượn sách'
        });
    }
};

const getBorrowStatistics = async (req, res) => {
    try {
        const userId = req.user.userId;

        const userResult = await query(`
            SELECT emailuser, nameuser FROM account_user WHERE iduser = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        const { emailuser: userEmail, nameuser: userName } = userResult.rows[0];

        const statsQuery = `
            SELECT 
                COUNT(*) as total_books,
                COUNT(CASE WHEN bbd.statusbook = 'BORROWED' THEN 1 END) as currently_borrowed,
                COUNT(CASE WHEN bbd.statusbook = 'RETURNED' THEN 1 END) as total_returned,
                COUNT(CASE WHEN bbd.statusbook = 'BORROWED' AND CURRENT_DATE > bbd.duedate THEN 1 END) as overdue_books,
                COUNT(DISTINCT br.idborrow) as total_borrows,
                AVG(CASE WHEN bbd.returndate IS NOT NULL THEN bbd.returndate - bbd.startdate END) as avg_borrow_days
            FROM borrow_records br
            JOIN thethuvien t ON br.idcard = t.idcard
            JOIN borrow_book_details bbd ON br.idborrow = bbd.idborrow
            WHERE t.emailcard = $1
        `;

        const statsResult = await query(statsQuery, [userEmail]);
        const stats = statsResult.rows[0];

        const categoriesQuery = `
            SELECT 
                s.categorybook,
                COUNT(*) as count
            FROM borrow_records br
            JOIN thethuvien t ON br.idcard = t.idcard
            JOIN borrow_book_details bbd ON br.idborrow = bbd.idborrow
            JOIN sach s ON bbd.idbook = s.idbook
            WHERE t.emailcard = $1
            GROUP BY s.categorybook
            ORDER BY count DESC
            LIMIT 5
        `;

        const categoriesResult = await query(categoriesQuery, [userEmail]);

        const recentQuery = `
            SELECT 
                bbd.statusbook,
                s.titlebook,
                bbd.startdate,
                bbd.returndate,
                bbd.duedate
            FROM borrow_records br
            JOIN thethuvien t ON br.idcard = t.idcard
            JOIN borrow_book_details bbd ON br.idborrow = bbd.idborrow
            JOIN sach s ON bbd.idbook = s.idbook
            WHERE t.emailcard = $1
            ORDER BY bbd.startdate DESC
            LIMIT 10
        `;

        const recentResult = await query(recentQuery, [userEmail]);

        res.json({
            success: true,
            data: {
                user: {
                    name: userName,
                    email: userEmail
                },
                statistics: {
                    totalBooks: parseInt(stats.total_books),
                    currentlyBorrowed: parseInt(stats.currently_borrowed),
                    totalReturned: parseInt(stats.total_returned),
                    overdueBooks: parseInt(stats.overdue_books),
                    totalBorrows: parseInt(stats.total_borrows),
                    averageBorrowDays: Math.round(parseFloat(stats.avg_borrow_days) || 0)
                },
                topCategories: categoriesResult.rows,
                recentActivity: recentResult.rows
            }
        });

    } catch (error) {
        console.error('Get borrow statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê'
        });
    }



};

    const sendReturnConfirmationEmail = async (userEmail, userName, returnData) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: userEmail,
            subject: '📚 Xác nhận trả sách thành công',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
                    <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #2c5aa0; text-align: center; margin-bottom: 30px;">
                            📚 Trả sách thành công!
                        </h2>
                        
                        <p style="font-size: 16px;">Xin chào <strong style="color: #2c5aa0;">${userName}</strong>,</p>
                        
                        <p style="color: #444; line-height: 1.6;">
                            Bạn đã trả sách thành công! Dưới đây là thông tin chi tiết:
                        </p>

                        <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2c5aa0;">
                            <h3 style="color: #2c5aa0; margin-top: 0; margin-bottom: 15px;">
                                📖 Thông tin trả sách
                            </h3>
                            <p style="margin: 8px 0;"><strong>Tên sách:</strong> ${returnData.bookTitle}</p>
                            <p style="margin: 8px 0;"><strong>Tác giả:</strong> ${returnData.bookAuthor}</p>
                            <p style="margin: 8px 0;"><strong>Ngày mượn:</strong> ${new Date(returnData.borrowDate).toLocaleDateString('vi-VN')}</p>
                            <p style="margin: 8px 0;"><strong>Ngày trả:</strong> <span style="color: #4caf50; font-weight: bold;">${new Date(returnData.returnDate).toLocaleDateString('vi-VN')}</span></p>
                            <p style="margin: 8px 0;"><strong>Số ngày mượn:</strong> ${returnData.daysBorrowed} ngày</p>
                            <p style="margin: 8px 0;"><strong>Trạng thái:</strong> <span style="color: #4caf50; font-weight: bold;">Đã trả đúng hạn</span></p>
                        </div>

                        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                            <h3 style="color: #2e7d32; margin-top: 0; margin-bottom: 15px;">
                                ✅ Cảm ơn bạn!
                            </h3>
                            <ul style="color: #444; line-height: 1.6; margin: 0; padding-left: 20px;">
                                <li>Cảm ơn bạn đã trả sách đúng hạn</li>
                                <li>Sách đã được cập nhật trong hệ thống</li>
                                <li>Bạn có thể tiếp tục mượn sách khác</li>
                                <li>Liên hệ thủ thư nếu cần hỗ trợ: library@example.com</li>
                            </ul>
                        </div>

                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
                            <p style="color: #666; margin: 5px 0;">Cảm ơn bạn đã sử dụng dịch vụ thư viện!</p>
                            <p style="color: #2c5aa0; font-weight: bold; margin: 5px 0;">📚 Thư viện trực tuyến</p>
                        </div>
                    </div>
                </div>
            `
        };

        await emailTransporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Send return confirmation email error:', error);
        return false;
    }
};
const returnBook = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { borrowId, bookId } = req.params;

        const userResult = await query(`
            SELECT emailuser FROM account_user WHERE iduser = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        const userEmail = userResult.rows[0].emailuser;

        const borrowCheck = await query(`
            SELECT bbd.*, br.statusborrow, t.namecard
            FROM borrow_book_details bbd
            JOIN borrow_records br ON bbd.idborrow = br.idborrow
            JOIN thethuvien t ON br.idcard = t.idcard
            WHERE bbd.idborrow = $1 AND bbd.idbook = $2 AND t.emailcard = $3
        `, [borrowId, bookId, userEmail]);

        if (borrowCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sách trong phiếu mượn của bạn'
            });
        }

        const bookBorrow = borrowCheck.rows[0];

        if (bookBorrow.statusbook !== 'BORROWED') {
            return res.status(400).json({
                success: false,
                message: 'Sách này đã được trả hoặc không trong trạng thái mượn'
            });
        }

        const returnDate = new Date();
        const borrowDate = new Date(bookBorrow.startdate);
        const daysBorrowed = Math.ceil((returnDate - borrowDate) / (1000 * 60 * 60 * 24));

        await query(`
            UPDATE borrow_book_details 
            SET statusbook = 'RETURNED', returndate = CURRENT_DATE, updatedat = CURRENT_TIMESTAMP
            WHERE idborrow = $1 AND idbook = $2
        `, [borrowId, bookId]);

        await query(`
            UPDATE sach 
            SET availablebook = availablebook + 1 
            WHERE idbook = $1
        `, [bookId]);

    

        const activeBooksCheck = await query(`
            SELECT COUNT(*) as count
            FROM borrow_book_details bbd
            WHERE bbd.idborrow = $1 AND bbd.statusbook = 'BORROWED'
        `, [borrowId]);

        const activeBooksCount = parseInt(activeBooksCheck.rows[0].count);
        if (activeBooksCount === 0) {
            await query(`
                UPDATE borrow_records 
                SET statusborrow = 'COMPLETED'
                WHERE idborrow = $1
            `, [borrowId]);
        }

        const bookInfo = await query(
            'SELECT titlebook, authorbook FROM sach WHERE idbook = $1',
            [bookId]
        );

        res.json({
            success: true,
            message: 'Trả sách thành công',
            data: {
                borrowId,
                bookId,
                returnDate: returnDate.toISOString().split('T')[0],
                daysBorrowed,
                status: 'RETURNED'
            }
        });

        if (bookInfo.rows.length > 0) {
            const book = bookInfo.rows[0];
            sendReturnConfirmationEmail(userEmail, bookBorrow.namecard, {
                bookTitle: book.titlebook,
                bookAuthor: book.authorbook,
                borrowDate: bookBorrow.startdate,
                returnDate: returnDate.toISOString().split('T')[0],
                daysBorrowed
            }).catch(err => console.error('Email sending error:', err));
        }

    } catch (error) {
        console.error('Return book error:', error);
        
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi trả sách'
            });
        }
    }
};

module.exports = {
    borrowBooks,
    getMyBorrows,
    renewBook,
        returnBook,  

    getBorrowHistory,
    getBorrowStatistics
};