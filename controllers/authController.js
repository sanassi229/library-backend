const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { query } = require('../config/database');

const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const generateCardId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'LIB';
    for (let i = 0; i < 9; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const sendLibraryCardEmail = async (email, name, cardId) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Đăng ký thẻ thư viện thành công',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c5aa0;">Chào mừng bạn đến với Thư viện!</h2>
                    <p>Xin chào <strong>${name}</strong>,</p>
                    <p>Chúc mừng bạn đã đăng ký thẻ thư viện thành công!</p>
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #2c5aa0; margin-top: 0;">Thông tin thẻ thư viện:</h3>
                        <p><strong>Mã thẻ:</strong> <span style="color: #d32f2f; font-size: 18px; font-weight: bold;">${cardId}</span></p>
                        <p><strong>Họ tên:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                    </div>
                    <p>Vui lòng lưu giữ mã thẻ này để sử dụng khi mượn sách và đăng ký tài khoản trực tuyến.</p>
                    <p>Trân trọng,<br>Đội ngũ Thư viện</p>
                </div>
            `
        };

        await emailTransporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Send email error:', error);
        return false;
    }
};

const registerAccount = async (req, res) => {
    try {
        const { name, email, password, cardId } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ: tên, email, mật khẩu'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        const emailCheck = await query(
            'SELECT * FROM account_user WHERE emailuser = $1',
            [email.toLowerCase()]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const userResult = await query(
            'INSERT INTO account_user (nameuser, emailuser, passworduser) VALUES ($1, $2, $3) RETURNING iduser, nameuser, emailuser, createdat',
            [name.trim(), email.toLowerCase(), hashedPassword]
        );

        const user = userResult.rows[0];
        let userResponse = {
            id: user.iduser,
            name: user.nameuser,
            email: user.emailuser,
            role: 'user',
            hasLibraryCard: false,
            createdAt: user.createdat
        };

        if (cardId) {
            const cardCheck = await query(
                'SELECT * FROM thethuvien WHERE idcard = $1',
                [cardId.toUpperCase()]
            );

            if (cardCheck.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã thẻ không tồn tại'
                });
            }

            const cardLinkCheck = await query(
                'SELECT * FROM docgia WHERE idcard = $1',
                [cardId.toUpperCase()]
            );

            if (cardLinkCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã thẻ đã được kết nối với tài khoản khác'
                });
            }

            await query(
                'INSERT INTO docgia (iduser, idcard) VALUES ($1, $2)',
                [user.iduser, cardId.toUpperCase()]
            );

            const cardInfo = cardCheck.rows[0];
            userResponse = {
                ...userResponse,
                role: 'member',
                hasLibraryCard: true,
                cardId: cardInfo.idcard,
                cardName: cardInfo.namecard,
                address: cardInfo.addresscard,
                phone: cardInfo.phonecard
            };
        }

        const token = generateToken(user.iduser);

        res.status(201).json({
            success: true,
            message: cardId ? 
                'Đăng ký tài khoản và liên kết thẻ thư viện thành công!' : 
                'Đăng ký tài khoản thành công! Bạn có thể đăng ký thẻ thư viện để mượn sách.',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Register account error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server trong quá trình đăng ký tài khoản'
        });
    }
};

const registerCardOnly = async (req, res) => {
    try {
        const { name, email, phone, address, cccd } = req.body;

        if (!name || !email || !phone || !address || !cccd) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại không hợp lệ'
            });
        }

        if (cccd.length !== 12) {
            return res.status(400).json({
                success: false,
                message: 'CCCD phải có 12 số'
            });
        }

        const emailCheck = await query(
            'SELECT * FROM thethuvien WHERE emailcard = $1',
            [email.toLowerCase()]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được đăng ký thẻ thư viện'
            });
        }

        const cccdCheck = await query(
            'SELECT * FROM thethuvien WHERE cccd = $1',
            [cccd]
        );

        if (cccdCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'CCCD đã được đăng ký thẻ thư viện'
            });
        }

        let cardId;
        let isCardIdUnique = false;
        let attempts = 0;
        
        while (!isCardIdUnique && attempts < 10) {
            cardId = generateCardId();
            const checkCardId = await query(
                'SELECT * FROM thethuvien WHERE idcard = $1',
                [cardId]
            );
            
            if (checkCardId.rows.length === 0) {
                isCardIdUnique = true;
            }
            attempts++;
        }

        if (!isCardIdUnique) {
            return res.status(500).json({
                success: false,
                message: 'Không thể tạo mã thẻ duy nhất. Vui lòng thử lại.'
            });
        }

        const result = await query(
            'INSERT INTO thethuvien (idcard, namecard, emailcard, addresscard, phonecard, cccd) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [cardId, name.trim(), email.toLowerCase(), address.trim(), phone.trim(), cccd.trim()]
        );

        const card = result.rows[0];

        const emailSent = await sendLibraryCardEmail(card.emailcard, card.namecard, card.idcard);

        if (!emailSent) {
            console.log('Failed to send email, but card was created successfully');
        }

        res.status(201).json({
            success: true,
            message: 'Đăng ký thẻ thư viện thành công! Vui lòng kiểm tra email để nhận mã thẻ.',
            data: {
                cardId: card.idcard,
                name: card.namecard,
                email: card.emailcard,
                address: card.addresscard,
                phone: card.phonecard,
                cccd: card.cccd,
                emailSent: emailSent
            }
        });

    } catch (error) {
        console.error('Register card only error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server trong quá trình đăng ký thẻ thư viện'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mật khẩu'
            });
        }

        const result = await query(`
            SELECT 
                u.iduser,
                u.nameuser,
                u.emailuser,
                u.passworduser,
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
                t.cccd,
                t.startcard,
                t.expirecard,
                t.statuscard
            FROM account_user u
            LEFT JOIN docgia d ON u.iduser = d.iduser
            LEFT JOIN thuthu th ON u.iduser = th.iduser
            LEFT JOIN thethuvien t ON d.idcard = t.idcard
            WHERE u.emailuser = $1
        `, [email.toLowerCase()]);

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passworduser);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        const token = generateToken(user.iduser);

        const userResponse = {
            id: user.iduser,
            name: user.nameuser,
            email: user.emailuser,
            role: user.userrole,
            hasLibraryCard: user.haslibrarycard,
            cardId: user.idcard,
            cardName: user.namecard,
            address: user.addresscard,
            phone: user.phonecard,
            cccd: user.cccd,
            memberSince: user.startcard,
            cardExpiry: user.expirecard,
            cardStatus: user.statuscard
        };

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server trong quá trình đăng nhập'
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await query(`
            SELECT 
                u.iduser,
                u.nameuser,
                u.emailuser,
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
                t.cccd,
                t.startcard,
                t.expirecard,
                t.statuscard
            FROM account_user u
            LEFT JOIN docgia d ON u.iduser = d.iduser
            LEFT JOIN thuthu th ON u.iduser = th.iduser
            LEFT JOIN thethuvien t ON d.idcard = t.idcard
            WHERE u.iduser = $1
        `, [userId]);

        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        const userResponse = {
            id: user.iduser,
            name: user.nameuser,
            email: user.emailuser,
            role: user.userrole,
            hasLibraryCard: user.haslibrarycard,
            cardId: user.idcard,
            cardName: user.namecard,
            address: user.addresscard,
            phone: user.phonecard,
            cccd: user.cccd,
            memberSince: user.startcard,
            cardExpiry: user.expirecard,
            cardStatus: user.statuscard
        };

        res.json({
            success: true,
            data: userResponse
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin người dùng'
        });
    }
};

const linkCardToAccount = async (req, res) => {
    try {
        const { cardId } = req.body;
        const userId = req.user.userId;

        if (!cardId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mã thẻ'
            });
        }

        const userCardCheck = await query(
            'SELECT * FROM docgia WHERE iduser = $1',
            [userId]
        );

        if (userCardCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản đã được liên kết với thẻ thư viện'
            });
        }

        const cardCheck = await query(
            'SELECT * FROM thethuvien WHERE idcard = $1',
            [cardId.toUpperCase()]
        );

        if (cardCheck.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Mã thẻ không tồn tại'
            });
        }

        const cardLinkCheck = await query(
            'SELECT * FROM docgia WHERE idcard = $1',
            [cardId.toUpperCase()]
        );

        if (cardLinkCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Mã thẻ đã được kết nối với tài khoản khác'
            });
        }

        await query(
            'INSERT INTO docgia (iduser, idcard) VALUES ($1, $2)',
            [userId, cardId.toUpperCase()]
        );

        const cardInfo = cardCheck.rows[0];

        res.json({
            success: true,
            message: 'Liên kết thẻ thư viện thành công!',
            data: {
                cardId: cardInfo.idcard,
                cardName: cardInfo.namecard,
                address: cardInfo.addresscard,
                phone: cardInfo.phonecard,
                cccd: cardInfo.cccd
            }
        });

    } catch (error) {
        console.error('Link card to account error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server trong quá trình liên kết thẻ'
        });
    }
};

module.exports = {
    registerAccount,
    registerCardOnly,
    login,
    getCurrentUser,
    linkCardToAccount,
    generateCardId
};