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
                + "where StdSSN = '" + req.body.id + "';"
  console.log(currentQuery);
  req.app.locals.db.all(currentQuery, [], (err, rows) => {
    if (err) {
      throw err;
    }
    req.app.locals.enrolledCourses = rows;

    // Do the other query here, and call res.render from its handler

    // Until the other query is implemented, call res.render here
    res.render('student', { role: req.body.role,
                            userID: req.body.id,
                            formdata: req.body,
                            enrolledCourses: req.app.locals.enrolledCourses
    });
  });
});

// Similar for faculty and registrar

module.exports = router;
