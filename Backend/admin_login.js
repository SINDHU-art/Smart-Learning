
const conn = require("../connection");


exports.admin_login = (req, res) => {
    const { admin_usn, password } = req.body;
  
    // Query to check if the admin exists with the provided credentials
    const query = 'SELECT * FROM admin WHERE admin_usn = ? AND password = ?';
    conn.query(query, [admin_usn, password], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).send('Database error');
      }
  
      if (results.length > 0) {
        // Admin found, login successful
        // res.status(200).send('Login successful');
        res.redirect('/admin_dashboard');

      } else {
        // No matching admin found
        res.status(401).send('Invalid Admin USN or password');
      }
    });
  };