const express = require("express");
const session = require('express-session');
const conn = require("./connection.js");
const path = require('path');  // Import path module
const bodyParser = require('body-parser');
const { user_login} = require("./Backend/user_login.js");
const { user_reg } = require("./Backend/user_reg.js")
const { admin_login } = require("./Backend/admin_login.js")
const { user_profile } = require("./Backend/user_profile.js")
const multer = require("multer")
const app = express();


// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.urlencoded({ extended: true }));  // To parse URL-encoded data (e.g., form data)
app.use(express.json());  // To parse JSON data if needed


// Set up session middleware
app.use(session({
  secret: 'yourSecretKey', // Replace with a more secure secret key in production
  resave: false,
  saveUninitialized: true
}));

// Set up multer to handle video file uploads
const storage = multer.memoryStorage();  // Store the video in memory as a buffer
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // This parses incoming JSON request bodies

// Serve static files (e.g., videos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));




app.set("view engine", "ejs");
app.set("views", "./views");


app.get("/", (req, res) => {
    res.render("user_login"); // Render login page
});

app.get("/user_reg" ,(req,res) => {
    res.render("user_reg");
})

// Route to render the admin login form
app.get('/admin-login', (req, res) => {
    res.render('admin_login'); // This assumes the EJS file is in the 'views' folder
  });

app.get('/user_dashboard',(req,res) => {
    res.render('user_dashboard');
});

app.get('/classes_web',(req,res) => {
    res.render('classes_web');
});

// app.get("/user_profile" , (req,res) => {
//     res.render("user_profile")
// })


  


app.post("/get-login", user_login);

app.post("/user_reg_done" , user_reg);

app.post("/admin-login" , admin_login);

app.get("/user_profile", user_profile);
// Backend - Enroll endpoint
app.post('/enroll', (req, res) => {
    // Destructure courseName from request body
    const { courseName } = req.body;
    

    // Log the entire request body to inspect
    console.log('Received body:', req.body);

    // Log the course name specifically
    console.log('Course Name:', courseName);

    // Check if courseName is missing
    if (!courseName) {
        return res.status(400).json({ success: false, message: 'Course name is missing' });
    }

    // Ensure that the user is logged in (check session)
    const usn = req.session.user ? req.session.user.usn : null;
    
    if (!usn) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    // Insert the course enrollment into the database
    const query = `INSERT INTO course_enrollments (usn, course_name) VALUES (?, ?)`;

    console.log('Inserting into database:', usn, courseName);
    console.log('Query:', query);
    
    conn.query(query, [usn, courseName], (err, results) => {
        if (err) {
            console.error('Error enrolling in course:', err);
            return res.status(500).json({ success: false, message: 'Error enrolling in course' });
        }

        return res.json({ success: true, message: 'Successfully enrolled in course' });
    });
});


app.get('/admin_dashboard', (req, res) => {
    const query = `
      SELECT 
          u.s_id,
          u.usn,
          u.name,
          u.dob,
          u.email,
          u.phno,
          u.password,
          c.course_name,
          c.enrollment_date
      FROM 
          users u
      JOIN 
          course_enrollments c ON u.usn = c.usn
      ORDER BY 
          c.enrollment_date DESC;
    `;
    
    conn.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).json({ success: false, message: 'Error fetching data' });
      }
  
      // Render the admin-dashboard.ejs view with the fetched data
      res.render('admin_dashboard', { users: results });
    });
  });

  // Route to serve the form (Frontend)
app.get('/register-course', (req, res) => {
    res.render('user_reg');
});



// Route to view all courses (admin view)
app.get('/courses', (req, res) => {
    const query = 'SELECT * FROM courses';
    conn.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching courses:', err);
            return res.status(500).json({ message: 'Error fetching courses' });
        }

        res.render('courses', { courses: results });
    });
});


app.post('/register-course', upload.single('video'), (req, res) => {
    const { course_name, description, duration } = req.body;
    console.log(req.body)
    const video = req.file.buffer;  // Access the video as a buffer
    
    const query = `INSERT INTO courses (course_name, description, duration, video) VALUES (?, ?, ?, ?)`;
    
    conn.query(query, [course_name, description, duration, video], (err, result) => {
      if (err) throw err;
      res.redirect('/admin_dashboard');  // Redirect to the dashboard after success
    });
});
  

// // Route to serve the video
// app.get('/video/:id', (req, res) => {
//     const courseId = req.params.id;  // Retrieve the course ID from the URL

//     // Query the database to get the video BLOB for the specified course
//     const query = 'SELECT video FROM courses WHERE id = ?';
    
//     conn.query(query, [courseId], (err, results) => {
//         if (err) {
//             console.error('Error fetching video:', err);
//             return res.status(500).send('Error fetching video');
//         }

//         if (results.length === 0) {
//             return res.status(404).send('Video not found');
//         }

//         const video = results[0].video;  // Assuming the video is stored in the 'video' column
//         res.contentType('video/mp4');  // Set the content type to video (if it’s an MP4 file)
//         res.send(video);  // Send the video binary data to the client
//     });
// });

// app.get("/classes_web" , (req,res) =>{
//     res.render("classes_web")
// })

// Route to enroll a user in a course
app.post('/classes_web', (req, res) => {
    const { course_name } = req.body; // Assuming course_name is passed in the body
    const user = req.session.user; // Assuming the user's 'usn' is stored in the session
    
    if (!user) {
        return res.status(401).send('User not logged in');
    }

    const usn = user.usn;  // Assuming 'usn' is stored in session

    // Get current date for enrollment_date
    const enrollment_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Check if the user is already enrolled in the course
    const checkQuery = `
        SELECT * FROM course_enrollments
        WHERE usn = ? AND course_name = ?
    `;
    
    conn.query(checkQuery, [usn, course_name], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error checking enrollment status');
        }
        
        // If user is already enrolled
        if (result.length > 0) {
            return res.status(400).send('Already enrolled in this course');
        }

        // Insert query to add course enrollment
        const insertQuery = `
            INSERT INTO course_enrollments (usn, course_name, enrollment_date)
            VALUES (?, ?, ?)
        `;
        
        conn.query(insertQuery, [usn, course_name, enrollment_date], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error enrolling in course');
            }

            // Redirect or send success response
            res.redirect("classes_web"); // You can customize this based on your flow
        });
    });
});

//this is for cn
app.post('/classes_cn', (req, res) => {
    const { course_name } = req.body; // Assuming course_name is passed in the body
    const user = req.session.user; // Assuming the user's 'usn' is stored in the session
    
    if (!user) {
        return res.status(401).send('User not logged in');
    }

    const usn = user.usn;  // Assuming 'usn' is stored in session

    // Get current date for enrollment_date
    const enrollment_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Check if the user is already enrolled in the course
    const checkQuery = `
        SELECT * FROM course_enrollments
        WHERE usn = ? AND course_name = ?
    `;
    
    conn.query(checkQuery, [usn, course_name], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error checking enrollment status');
        }
        
        // If user is already enrolled
        if (result.length > 0) {
            return res.status(400).send('Already enrolled in this course');
        }

        // Insert query to add course enrollment
        const insertQuery = `
            INSERT INTO course_enrollments (usn, course_name, enrollment_date)
            VALUES (?, ?, ?)
        `;
        
        conn.query(insertQuery, [usn, course_name, enrollment_date], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error enrolling in course');
            }

            // Redirect or send success response
            res.redirect("classes_cn"); // You can customize this based on your flow
        });
    });
});




//this is for ai
app.post('/classes_ai', (req, res) => {
    const { course_name } = req.body; // Assuming course_name is passed in the body
    const user = req.session.user; // Assuming the user's 'usn' is stored in the session
    
    if (!user) {
        return res.status(401).send('User not logged in');
    }

    const usn = user.usn;  // Assuming 'usn' is stored in session

    // Get current date for enrollment_date
    const enrollment_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Check if the user is already enrolled in the course
    const checkQuery = `
        SELECT * FROM course_enrollments
        WHERE usn = ? AND course_name = ?
    `;
    
    conn.query(checkQuery, [usn, course_name], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error checking enrollment status');
        }
        
        // If user is already enrolled
        if (result.length > 0) {
            return res.status(400).send('Already enrolled in this course');
        }

        // Insert query to add course enrollment
        const insertQuery = `
            INSERT INTO course_enrollments (usn, course_name, enrollment_date)
            VALUES (?, ?, ?)
        `;
        
        conn.query(insertQuery, [usn, course_name, enrollment_date], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error enrolling in course');
            }

            // Redirect or send success response
            res.redirect("classes_ai"); // You can customize this based on your flow
        });
    });
});

//this is for python
app.post('/classes_py', (req, res) => {
    const { course_name } = req.body; // Assuming course_name is passed in the body
    const user = req.session.user; // Assuming the user's 'usn' is stored in the session
    
    if (!user) {
        return res.status(401).send('User not logged in');
    }

    const usn = user.usn;  // Assuming 'usn' is stored in session

    // Get current date for enrollment_date
    const enrollment_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Check if the user is already enrolled in the course
    const checkQuery = `
        SELECT * FROM course_enrollments
        WHERE usn = ? AND course_name = ?
    `;
    
    conn.query(checkQuery, [usn, course_name], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error checking enrollment status');
        }
        
        // If user is already enrolled
        if (result.length > 0) {
            return res.status(400).send('Already enrolled in this course');
        }

        // Insert query to add course enrollment
        const insertQuery = `
            INSERT INTO course_enrollments (usn, course_name, enrollment_date)
            VALUES (?, ?, ?)
        `;
        
        conn.query(insertQuery, [usn, course_name, enrollment_date], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error enrolling in course');
            }

            // Redirect or send success response
            res.redirect("classes_py"); // You can customize this based on your flow
        });
    });
});

//   app.get("/course_page",(req, res) =>{
//     res.render("course_web")
//   })

// Assuming you have a connection to the database in `conn`
app.get('/enroll', (req, res) => {
    // const { course_name } = req.body;  // Access course_name from form submission
    const course_name = "Web Development";

    if (!course_name) {
        return res.status(400).json({
            success: false,
            message: "Course name is missing"
        });
    }

    // Query the database to get the video URL for the specified course
    const query = `
        SELECT video FROM courses WHERE course_name = ?
    `;

    conn.query(query, [course_name], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error retrieving course video');
        }

        if (result.length === 0) {
            return res.status(404).send('Course not found');
        }

        // Extract the video URL from the query result
        const videoUrl = result[0].video;

        // Render the course page with the video URL
        res.render('course_web', { course_name, videoUrl });
    });
});




//this is enrol for ai
app.get('/enroll_ai', (req, res) => {
    // const { course_name } = req.body;  // Access course_name from form submission
    const course_name = "Artificial Intelligence";

    if (!course_name) {
        return res.status(400).json({
            success: false,
            message: "Course name is missing"
        });
    }

    // Query the database to get the video URL for the specified course
    const query = `
        SELECT video FROM courses WHERE course_name = ?
    `;

    conn.query(query, [course_name], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error retrieving course video');
        }

        if (result.length === 0) {
            return res.status(404).send('Course not found');
        }

        // Extract the video URL from the query result
        const videoUrl = result[0].video;

        // Render the course page with the video URL
        res.render('course_ai', { course_name, videoUrl });
    });
});

//this is enrol for cn
app.get('/enroll_cn', (req, res) => {
    // const { course_name } = req.body;  // Access course_name from form submission
    const course_name = req.body;//"Computer Networks";

    if (!course_name) {
        return res.status(400).json({
            success: false,
            message: "Course name is missing"
        });
    }

    // Query the database to get the video URL for the specified course
    const query = `
        SELECT video FROM courses WHERE course_name = ?
    `;

    conn.query(query, [course_name], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error retrieving course video');
        }

        if (result.length === 0) {
            return res.status(404).send('Course not found');
        }

        // Extract the video URL from the query result
        const videoUrl = result[0].video;

        // Render the course page with the video URL
        res.render('course_cn', { course_name, videoUrl });
    });
});


//this is enrol for py
app.get('/enroll_py', (req, res) => {
    // const { course_name } = req.body;  // Access course_name from form submission
    const course_name = "Python Programming";

    if (!course_name) {
        return res.status(400).json({
            success: false,
            message: "Course name is missing"
        });
    }

    // Query the database to get the video URL for the specified course
    const query = `
        SELECT video FROM courses WHERE course_name = ?
    `;

    conn.query(query, [course_name], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error retrieving course video');
        }

        if (result.length === 0) {
            return res.status(404).send('Course not found');
        }

        // Extract the video URL from the query result
        const videoUrl = result[0].video;

        // Render the course page with the video URL
        res.render('course_py', { course_name, videoUrl });
    });
});





app.get("/classes-web",(req,res) =>{
    res.render("classes_web");
});

app.get("/classes-cn",(req,res) =>{
    res.render("classes_cn");
});

app.get("/classes-ai",(req,res) =>{
    res.render("classes_ai");
});

app.get("/classes-py",(req,res) =>{
    res.render("classes_py");
});



  app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send('Error during logout');
      }
      res.status(200).send('Successfully logged out');
    });
  });

// Start the server
const PORT = 3010;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


// Route to render the course page
app.get('/course-web/:course_name', (req, res) => {
    const courseName = req.params.course_name;

    const query = `SELECT course_name, description FROM courses WHERE course_name = ?`;
    conn.query(query, [courseName], (err, result) => {
        if (err) {
            console.error('Error fetching course details:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (result.length > 0) {
            const course = result[0];
            res.render('course_page', { course });
        } else {
            res.status(404).send('Course not found');
        }
    });
});



// Route to render the course page
app.get('/course-cn/:course_name', (req, res) => {
    const courseName = req.params.course_name;

    const query = `SELECT course_name, description FROM courses WHERE course_name = ?`;
    conn.query(query, [courseName], (err, result) => {
        if (err) {
            console.error('Error fetching course details:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (result.length > 0) {
            const course = result[0];
            res.render('course_page', { course });
        } else {
            res.status(404).send('Course not found');
        }
    });
});





app.get('/video/:course_name', (req, res) => {
    const courseName = req.params.course_name;
    console.log(courseName)

    const query = `SELECT video FROM courses WHERE course_name = ?`;
    conn.query(query, [courseName], (err, result) => {
        if (err) {
            console.error('Error fetching video:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (result.length > 0) {
            const videoBuffer = result[0].video;

            res.setHeader('Content-Type', 'video/mp4');
            res.status(200).send(videoBuffer);
        } else {
            res.status(404).send('Video not found');
        }
    });
});

// Handle File Upload
app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = `/uploads/${req.file.filename}`;
    res.render('upload', { uploadedFilePath: filePath });
});