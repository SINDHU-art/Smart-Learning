const conn = require("../connection");


// POST route to handle user login


// Route to render the registration form
exports.user_reg = (req, res) => {
    const { s_id, usn, name, dob, email, phno, password } = req.body;
  
    // Insert user data into the database
    const query = 'INSERT INTO users (s_id, usn, name, dob, email, phno, password) VALUES (?, ?, ?, ?, ?, ?, ?)';
    conn.query(query, [s_id, usn, name, dob, email, phno, password], (err, results) => {
      if (err) {
        console.error('Error inserting user into the database:', err);
        return res.status(500).send('Error saving user data');
      }
  
      res.status(200).send('User registered successfully');
    });
  };
  