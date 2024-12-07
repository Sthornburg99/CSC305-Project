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
      const enrollQuery = 'insert into Enrollment (StdSSN, OfferNo) values (?, ?)';
      req.app.locals.db.run(enrollQuery, [req.body.id, req.body.courseOfferNo], function(err) {
        if (err) {
          console.error("Add error:", err);
        } else {
          console.log("Added course:", req.body.courseOfferNo);
        }
      });
    } else if (req.body.value === 'Drop') {
      const dropQuery = 'delete from Enrollment where StdSSN = ? and OfferNo = ?';
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
    select CourseNo, OffTerm, OffYear, FacFirstName, FacLastName, EnrGrade
    from Enrollment 
    join Offering on Enrollment.OfferNo = Offering.OfferNo
    left join Faculty on Offering.FacSSN = Faculty.FacSSN 
    where StdSSN = ?`;

  req.app.locals.db.all(getEnrolledQuery, [req.body.id], (err, enrolledRows) => {
    if (err) throw err;
    
    // Get available courses (including those without professors)
    let availableQuery = `
      select OfferNo, CourseNo, FacFirstName, FacLastName, OffLocation, OffTime, OffDays
      from Offering 
      left join Faculty on Offering.FacSSN = Faculty.FacSSN
      where OffTerm = "WINTER"`;
    
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

  facultyQuerry = `
    select CourseNo, OffTerm, OffYear 
    from Offering 
    where FacSSN = ?`;

  req.app.locals.db.all(facultyQuerry, [req.body.id], (err, rows) => {
    if (err) {
      throw err;
    }
    req.app.locals.currentCourses = rows;
  
    studentsQuerry = `
      select s.StdFirstName, s.StdLastName, s.StdSSN, e.EnrGrade, o.CourseNo, e.OfferNo
      from Student s
      join Enrollment e on s.StdSSN = e.StdSSN
      join Offering o on e.OfferNo = o.OfferNo
      where o.FacSSN = ?`;

    req.app.locals.db.all(studentsQuerry, [req.body.id], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.currentStudent = rows;

      res.render('faculty', { 
        role: req.body.role,
        userID: req.body.id,
        formdata: req.body,
        currentCourses: req.app.locals.currentCourses,
        currentStudent: req.app.locals.currentStudent
      });
    });                    
  });
});

router.post('/editgrade', function(req, res, next) {
  console.log("Grade update body:", req.body);

  // Update grade for specific course enrollment
  const updateGrade = `
    update Enrollment 
    set EnrGrade = ? 
    where StdSSN = ? and OfferNo = ?`;

  // First do the update and wait for it to complete
  req.app.locals.db.run(updateGrade, [req.body.EnrGrade, req.body.StdSSN, req.body.OfferNo], function(err) {
    if (err) {
      console.error("Grade update error:", err);
      return next(err);
    }

    // Get faculty's courses after update
    const facultyQuery = `
      select CourseNo, OffTerm, OffYear 
      from Offering 
      where FacSSN = ?`;

    req.app.locals.db.all(facultyQuery, [req.body.id], (err, courseRows) => {
      if (err) {
        console.error("Faculty query error:", err);
        return next(err);
      }

      // Get all students and their grades after update
      const studentsQuery = `
        select s.StdFirstName, s.StdLastName, s.StdSSN, e.EnrGrade, o.CourseNo, e.OfferNo
        from Student s
        join Enrollment e on s.StdSSN = e.StdSSN
        join Offering o on e.OfferNo = o.OfferNo
        where o.FacSSN = ?`;

      req.app.locals.db.all(studentsQuery, [req.body.id], (err, studentRows) => {
        if (err) {
          console.error("Student query error:", err);
          return next(err);
        }

        // Render with updated data
        res.render('faculty', {
          role: req.body.role,
          userID: req.body.id,
          formdata: req.body,
          currentCourses: courseRows,
          currentStudent: studentRows
        });
      });
    });
  });
});

router.post('/registrar', function(req, res, next) {
  console.log(req.body);

  // Get all courses with faculty info
  coursesQuerry = `
    select OfferNo, CourseNo, FacFirstName, FacLastName, OffLocation, OffTime, OffDays
    from Offering 
    join Faculty on Offering.FacSSN = Faculty.FacSSN`;

  req.app.locals.db.all(coursesQuerry, [], (err, rows) => {
    if (err) {
      throw err;
    }
    req.app.locals.openCourses = rows;

    // Get unique locations
    let locationsQuery = `
      select distinct OffLocation 
      from Offering 
      where OffLocation is not null 
      order by OffLocation`;

    req.app.locals.db.all(locationsQuery, [], (err, locationRows) => {
      if (err) {
        throw err;
      }
      // Extract location strings from the rows
      const locations = locationRows.map(row => row.OffLocation);
      
      // Get courses that can be edited
      changesQuerry = `
        select FacFirstName, FacLastName, OffTime, OffDays, OffLocation
        from Offering 
        join Faculty on Offering.FacSSN = Faculty.FacSSN`;

      req.app.locals.db.all(changesQuerry, [], (err, changeRows) => {
        if (err) {
          throw err;
        }
        req.app.locals.changeCourses = changeRows;
        
        // Render the page with all data
        res.render('registrar', { 
          role: req.body.role,
          userID: req.body.id,
          formdata: req.body,
          openCourses: req.app.locals.openCourses,
          changeCourses: req.app.locals.changeCourses,
          locations: locations
        });
      });
    });
  });
});
router.post('/editCourses', function(req, res, next) {
  console.log("Edit course body:", req.body);

  const updateQuery = `
    update Offering 
    set FacFirstName = ?, 
        FacLastName = ?, 
        OffLocation = ?, 
        OffTime = ?, 
        OffDays = ? 
    where OfferNo = ?`;

  req.app.locals.db.run(updateQuery, 
    [req.body.FacFirstName, 
     req.body.FacLastName, 
     req.body.OffLocation, 
     req.body.OffTime, 
     req.body.OffDays, 
     req.body.OfferNo], (err) => {
    if (err) {
      console.error("Update error:", err);
      return next(err);
    }
    // Redirect back to registrar to refresh data
    res.redirect(307, '/registrar');
  });
});

router.post('/addCourse', function(req, res, next) {
  console.log("Add course body:", req.body);

  const insertQuery = "insert into Offering (CourseNo, OfferNo, FacFirstName, FacLastName, OffLocation, OffTime, OffDays, OffTerm, OffYear) values (?, ?, ?, ?, ?, ?, ?, 'WINTER', '2025')";

  req.app.locals.db.run(insertQuery, 
      [req.body.CourseNo,
       req.body.OfferNo,
       req.body.FacFirstName,
       req.body.FacLastName,
       req.body.OffLocation,
       req.body.OffTime,
       req.body.OffDays], 
      function(err) {
          if (err) {
              console.error("Insert error:", err);
              return next(err);
          }
          res.redirect(307, '/registrar');
      }
  );
});
module.exports = router;