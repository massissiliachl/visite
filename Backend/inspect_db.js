require('dotenv').config();
const { sequelize } = require('./models');

(async () => {
  try {
    const [cols] = await sequelize.query(
      "SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name='properties' ORDER BY ordinal_position"
    );
    console.log(JSON.stringify(cols, null, 2));
    const [rows] = await sequelize.query('SELECT id, images FROM properties LIMIT 5');
    console.log('ROWS:', JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
})();
