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
  // Do appropriate tweaking here before calling res.render
  console.log(req.body);

  currentQuery = 'select CourseNo, OffTerm, OffYear, FacFirstName, FacLastName, EnrGrade '
                + 'from (Enrollment natural join Offering) '
                + 'left join Faculty on Offering.FacSSN = Faculty.FacSSN '
                + 'where OffTerm = "FALL" and OffYear = "2024"'
  console.log(currentQuery);
  req.app.locals.db.all(currentQuery, [], (err, rows) => {
    if (err) {
      throw err;
    }
    req.app.locals.enrolledCourses = rows;

    // Do the other query here, and call res.render from its handler
    availableQuery = 'select CourseNo, FacFirstName, FacLastName, OffLocation, OffTime, OffDays '
                    + 'from Offering ' 
                    + 'left join Faculty on Offering.FacSSN = Faculty.FacSSN '
                    + 'where OffTerm = "WINTER"'
    console.log(availableQuery);
    req.app.locals.db.all(availableQuery, [], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.availableCourses = rows;
      /*let addQuery = 'select OfferNo, CourseNo, FacFirstName, FacLastName, OffLocation, OffTime, OffDays '
                      + 'from Offering '
                      + 'left join Faculty on Offering.FacSSN = Faculty.FacSSN '
                      + 'where OffTerm = "WINTER" and OffYear ="2025"'
    req.app.locals.db.all(addQuery, [], (err, rows) => {
      if (err){
        throw err;
      }
      req.app.locals.addingCourses=rows;
     })*/
    // Until the other query is implemented, call res.render here
    res.render('student', { role: req.body.role,
                            userID: req.body.id,
                            formdata: req.body,
                            enrolledCourses: req.app.locals.enrolledCourses,
                            availableCourses: req.app.locals.availableCourses
                            //addingCourses: req.app.locals.addingCourses
    });
  });
});
});

router.post('/enrolled', function(req, res, next) {
  if (req.app.locals.formdata) {
    let addQuery = 'select OfferNo, CourseNo, FacFirstName, FacLastName, OffLocation, OffTime, OffDays '
                  + 'from Offering '
                  + 'left join Faculty on Offering.FacSSN = Faculty.FacSSN '
                  + 'where OffTerm = "WINTER" and OffYear ="2025"'
    req.app.locals.db.all(addQuery, [], (err, rows) => {
      if (err){
        throw err;
      }
      req.app.locals.addingCourses=rows;
    })

  res.render('student', { role: req.body.role,
    userID: req.body.id,
    formdata: req.body,
    enrolledCourses: req.app.locals.enrolledCourses,
    availableCourses: req.app.locals.availableCourses,
    addingCourses: req.app.locals.addingCourses
  });
  };
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