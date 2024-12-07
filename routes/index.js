var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.app.locals.db) {
    console.log('Got the database');
  }
  res.render('index', { title: 'Express' });
});


router.post('/student', function(req, res, next) {
  console.log("Request body:", req.body);

  // Handle Add/Drop based on which submit button was clicked
  if (req.body.EnrollmentStatus === 'on') {
    if (req.body.value === 'Add') {
      const enrollQuery = 'INSERT INTO Enrollment (StdSSN, OfferNo) VALUES (?, ?)';
      req.app.locals.db.run(enrollQuery, [req.body.id, req.body.courseOfferNo], function(err) {
        if (err) {
          console.error("Add error:", err);
        } else {
          console.log("Added course:", req.body.courseOfferNo);
        }
      });
    } else if (req.body.value === 'Drop') {
      const dropQuery = 'DELETE FROM Enrollment WHERE StdSSN = ? AND OfferNo = ?';
      req.app.locals.db.run(dropQuery, [req.body.id, req.body.courseOfferNo], function(err) {
        if (err) {
          console.error("Drop error:", err);
        } else {
          console.log("Dropped course:", req.body.courseOfferNo);
        }
      });
    }
  }

  // Get enrolled courses
  let getEnrolledQuery = `
    SELECT CourseNo, OffTerm, OffYear, FacFirstName, FacLastName, EnrGrade
    FROM Enrollment 
    JOIN Offering ON Enrollment.OfferNo = Offering.OfferNo
    LEFT JOIN Faculty ON Offering.FacSSN = Faculty.FacSSN 
    WHERE StdSSN = ?`;

  req.app.locals.db.all(getEnrolledQuery, [req.body.id], (err, enrolledRows) => {
    if (err) throw err;
    
    // Get available courses (including those without professors)
    let availableQuery = `
      SELECT OfferNo, CourseNo, FacFirstName, FacLastName, OffLocation, OffTime, OffDays
      FROM Offering 
      LEFT JOIN Faculty ON Offering.FacSSN = Faculty.FacSSN
      WHERE OffTerm = "WINTER"`;
    
    req.app.locals.db.all(availableQuery, [], (err, availableRows) => {
      if (err) throw err;
      
      res.render('student', { 
        role: req.body.role,
        userID: req.body.id,
        formdata: req.body,
        enrolledCourses: enrolledRows,
        availableCourses: availableRows
      });
    });
  });
});

router.post('/faculty', function(req, res, next) {
  console.log(req.body);

  facultyQuerry = 'select CourseNo, OffTerm, OffYear '
                + 'from Offering '
                + "where FacSSN = '" + req.body.id + "';"

  console.log(facultyQuerry)
  req.app.locals.db.all(facultyQuerry, [], (err, rows) => {
    if (err) {
      throw err;
    }
    req.app.locals.currentCourses = rows;
  
    studentsQuerry = 'select StdFirstName, StdLastName, StdSSN, EnrGrade '
                    + 'from (Student natural join Enrollment) '
                    + 'left join Offering on Enrollment.OfferNo = Offering.OfferNo '
                    + "where FacSSN = '" + req.body.id +"';"

    console.log(studentsQuerry)
    req.app.locals.db.all(studentsQuerry, [], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.currentStudent = rows;
    

    res.render('faculty', { role: req.body.role,
                            userID: req.body.id,
                            formdata: req.body,
                            currentCourses: req.app.locals.currentCourses,
                            currentStudent: req.app.locals.currentStudent
      });
    });                    
  });
});

router.post('/editgrade', function(req, res, next) {


  res.render('faculty', { role: req.body.role,
    userID: req.body.id,
    formdata: req.body,
    currentCourses: req.app.locals.currentCourses,
    currentStudent: req.app.locals.currentStudent
  });
});

router.post('/registrar', function(req, res, next) {
  console.log(req.body);

  coursesQuerry = 'select OfferNo, CourseNo, FacFirstName, FacLastName, OffLocation, OffTime, OffDays '
                + 'from Offering '
                + 'join Faculty on Offering.FacSSN = Faculty.FacSSN'

  console.log(coursesQuerry)
  req.app.locals.db.all(coursesQuerry, [], (err, rows) => {
    if (err) {
      throw err;
    }
    req.app.locals.openCourses = rows;

  changesQuerry = 'select FacFirstName, FacLastName, OffTime, OffDays, OffLocation '
                + 'from Offering '
                + 'join Faculty on Offering.FacSSN = Faculty.FacSSN'

  console.log(changesQuerry)
  req.app.locals.db.all(changesQuerry, [], (err, rows) => {
    if (err) {
      throw err;
    }
  req.app.locals.changeCourses = rows;
  
    

    res.render('registrar', { role: req.body.role,
                            userID: req.body.id,
                            formdata: req.body,
                            openCourses: req.app.locals.openCourses,
                            changeCourses: req.app.locals.changeCourses

      });
    });                    
  });
});
router.post('/editCourses', function(req, res, next) {

  res.render('registrar', { role: req.body.role,
    userID: req.body.id,
    formdata: req.body,
    openCourses: req.app.locals.openCourses,
    changeCourses: req.app.locals.changeCourses
  });
});

router.post('/addCourse', function(req, res, next) {

  res.render('registrar', { role: req.body.role,
    userID: req.body.id,
    formdata: req.body,
    openCourses: req.app.locals.openCourses,
    changeCourses: req.app.locals.changeCourses
  });
});
module.exports = router;