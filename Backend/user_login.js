 const conn = require("../connection");


// // POST route to handle user login
// exports.user_login=(req, res) => {
//     // Extract the usn and password from the request body+
//     const { usn, password } = req.body;
  
//     // Query to check if the user exists with the provided usn and password
//     const query = 'SELECT * FROM users WHERE usn = ? AND password = ?';
  
//     conn.query(query, [usn, password], (err, results) => {
//       if (err) {
//         console.error('Error executing query:', err);
//         return res.status(500).json({ message: 'Database error' });
//       }
  
//       if (results.length > 0) {
//         // User found, login successful
//         return res.status(200).json({ message: 'Login successful', user: results[0] });
//       } else {
//         // No matching user found
//         return res.status(401).json({ message: 'Invalid USN or password' });
//       }
//     });
//   };

// Login route
// exports.user_login= (req, res) => {
//   const { username, password } = req.body;

//   // Query the database for the user with the given username
//   conn.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
//     if (err) {
//       console.error('Database query error: ' + err.stack);
//       return res.send(`
//         <script>
//           alert('An error occurred. Please try again later.');
//           window.location.href = '/user_dashboard';
//         </script>
//       `);
//     }

//     if (results.length > 0) {
//       // User found, compare the password with the stored hash
//       const user = results[0];
//       bcrypt.compare(password, user.password, (err, isMatch) => {
//         if (err) {
//           console.error('Password comparison error: ' + err.stack);
//           return res.send(`
//             <script>
//               alert('An error occurred. Please try again later.');
//               window.location.href = '/login';
//             </script>
//           `);
//         }

//         if (isMatch) {
//           // Password matched, create a session and redirect to dashboard
//           req.session.user = user;

//           res.send(`
//             <script>
//               alert('Login successful! Redirecting to the dashboard...');
//               window.location.href = '/dashboard';
//             </script>
//           `);
//         } else {
//           // Invalid password
//           res.send(`
//             <script>
//               alert('Invalid credentials. Please try again.');
//               window.location.href = '/login';
//             </script>
//           `);
//         }
//       });
//     } else {
//       // User not found
//       res.send(`
//         <script>
//           alert('Invalid credentials. Please try again.');
//           window.location.href = '/login';
//         </script>
//       `);
//     }
//   });
// };

// // // Dashboard route (protected)
// // app.get('/dashboard', (req, res) => {
// //   if (!req.session.user) {
// //     // Redirect to login if not authenticated
// //     return res.redirect('/login');
// //   }

// //   res.send(`
// //     <h1>Welcome to the Dashboard, ${req.session.user.username}!</h1>
// //     <a href="/logout">Logout</a>
// //   `);
// // });

// // // Logout route
// // app.get('/logout', (req, res) => {
// //   req.session.destroy((err) => {
// //     if (err) {
// //       return res.send('Error logging out');
// //     }
// //     res.redirect('/login');
// //   });
// // });

// exports.user_login = (req, res) => {
//   const { usn, password } = req.body;

//   if (!usn || !password) {
//       return res.status(400).send(`
//           <script>
//               alert('Please fill in all fields.');
//               window.location='/';
//           </script>
//       `);
//   }

//   const query = "SELECT * FROM users WHERE usn = ? AND password = ?";
//   conn.query(query, [usn, password], (error, results) => {
//       if (error) {
//           console.error("Database error:", error);
//           return res.status(500).send(`
//               <script>
//                   alert('Something went wrong. Please try again later.');
//                   window.location='/';
//               </script>
//           `);
//       }

//       if (results.length > 0) {
//           // Login successful
//           req.session.user = {
//               usn: results[0].usn,
//               name: results[0].name,
//               email: results[0].email,
//               phno : results[0].phno,
//               dob: results[0].dob,
//               // aadhar_no : user[0].aadhar_no,
//           }; // Store user info in the session

//           console.log("User logged in:", req.session.user);
//           return res.redirect("/user_dashboard"); // Redirect to dashboard
//       } else {
//           // Invalid credentials
//           return res.status(401).send(`
//               <script>
//                   alert('Invalid usn or Password. Please try again.');
//                   window.location='/';
//               </script>
//           `);
//       }
//   });
// };


// Example login code
exports.user_login =  (req, res) => {
  const { usn, password } = req.body;
  
  const query = 'SELECT * FROM users WHERE usn = ? AND password = ?';
  conn.query(query, [usn, password], (err, results) => {
      if (err || results.length === 0) {
          return res.status(401).send('Invalid login credentials');
      }

      req.session.user = {
          usn: results[0].usn,
          name: results[0].name,
          email: results[0].email,
          phno: results[0].phno,
          dob: results[0].dob,
      };

      res.redirect('/user_profile');
  });
};
