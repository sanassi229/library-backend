const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT) || 1433,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const initDatabase = async () => {
    let pool;
    
    try {
        console.log('🔄 Initializing database...');
        
        pool = await sql.connect(config);
        
        console.log('📁 Creating database...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'LibraryManagement')
            CREATE DATABASE LibraryManagement
        `);
        
        await pool.close();
        
        const dbConfig = { ...config, database: 'LibraryManagement' };
        pool = await sql.connect(dbConfig);
        
        console.log('📖 Reading SQL file...');
        
        const sqlFilePath = path.join(__dirname, '../SQL - Quản lý thư viện.sql');
        
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`SQL file not found at: ${sqlFilePath}`);
        }
        
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('⚙️  Processing SQL statements...');
        
        console.log(`📄 SQL file size: ${sqlContent.length} characters`);
        
        let cleanSql = sqlContent;
        
        cleanSql = cleanSql.replace(/declare @sql nvarchar\(max\)[\s\S]*?Exec Sp_executesql @sql/gi, '');
        
        const statements = [];
        
        const tableMatches = cleanSql.match(/CREATE TABLE[\s\S]*?(?=CREATE TABLE|CREATE PROC|$)/gi);
        if (tableMatches) {
            statements.push(...tableMatches);
        }
        
        const procMatches = cleanSql.match(/CREATE PROC[\s\S]*?(?=CREATE PROC|CREATE TABLE|$)/gi);
        if (procMatches) {
            statements.push(...procMatches);
        }
        
        const alterMatches = cleanSql.match(/ALTER TABLE[\s\S]*?;/gi);
        if (alterMatches) {
            statements.push(...alterMatches);
        }
        
        const filteredStatements = statements
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Found ${filteredStatements.length} SQL statements to execute`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < filteredStatements.length; i++) {
            const statement = filteredStatements[i].trim();
            
            if (statement.length === 0) continue;
            
            try {
                console.log(`   Executing statement ${i + 1}/${filteredStatements.length}...`);
                
                let cleanStatement = statement
                    .replace(/^\s*GO\s*$/gmi, '') 
                    .replace(/--.*$/gm, '') 
                    .trim();
                
                if (cleanStatement.length === 0) {
                    continue;
                }
                
                console.log(`      ${cleanStatement.substring(0, 100)}...`);
                
                await pool.request().query(cleanStatement);
                successCount++;
                
            } catch (error) {
                errorCount++;
                console.warn(`   ⚠️  Warning in statement ${i + 1}: ${error.message}`);
                
                if (error.message.includes('already exists')) {
                    console.log(`   ℹ️  Object already exists, skipping...`);
                } else {
                    console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
                }
            }
        }
        
        console.log('🔍 Verifying database structure...');
        
        const tablesResult = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);
        
        const proceduresResult = await pool.request().query(`
            SELECT ROUTINE_NAME 
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_TYPE = 'PROCEDURE'
            ORDER BY ROUTINE_NAME
        `);
        
        console.log('✅ Database initialization completed!');
        console.log(`📊 Summary:`);
        console.log(`   - ${successCount} statements executed successfully`);
        console.log(`   - ${errorCount} warnings/errors (mostly duplicates)`);
        console.log(`   - ${tablesResult.recordset.length} tables created`);
        console.log(`   - ${proceduresResult.recordset.length} stored procedures created`);
        
        console.log('\n📋 Tables created:');
        tablesResult.recordset.forEach(table => {
            console.log(`   - ${table.TABLE_NAME}`);
        });
        
        console.log('\n🔧 Stored procedures created:');
        proceduresResult.recordset.slice(0, 10).forEach(proc => {
            console.log(`   - ${proc.ROUTINE_NAME}`);
        });
        
        if (proceduresResult.recordset.length > 10) {
            console.log(`   - ... and ${proceduresResult.recordset.length - 10} more`);
        }
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    } finally {
        if (pool) {
            await pool.close();
        }
    }
};

if (require.main === module) {
    initDatabase()
        .then(() => {
            console.log('🎉 Database ready for use!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Initialization failed:', error);
            process.exit(1);
        });
}

module.exports = initDatabase;