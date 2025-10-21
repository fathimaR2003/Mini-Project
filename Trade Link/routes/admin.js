var express = require('express');
var router = express.Router();
var admindb = require('../database/adminbase');
var userdb = require('../database/userbase');

var verifyAdminLogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  }
  else {
    res.redirect('/admin/login')
  }
}
router.get('/', verifyAdminLogin, async (req, res) => {
  const counts = [];
  const usercount = await admindb.Find_howmant_users_are_on_mt_website()
  counts.push(usercount)
  const workercount = await admindb.Find_howmant_worker_are_on_mt_website()
  counts.push(workercount)
 
  const users = await admindb.Get_all_users_For_admin_dashbord();
 const worker = await admindb. Get_all_worker_For_admin_dashbord()

  res.render('./admin/first-page', {usergrowth:usercount,workergrowth:workercount, admin: true, admins: req.session.admin,count:counts,userdash:users,workerdash:worker })
})
/* GET users listing. */
router.get('/login', function (req, res, next) {
  if (req.session.adminfalse) {
    res.render('./admin/login-page', { err: "Incorrect Username Or Password" })
    req.session.adminfalse = false
  }
  else {
    res.render('./admin/login-page')
  }

});
router.get('/accept', verifyAdminLogin, (req, res) => {

  admindb.Show_Worker_Registration_Request().then((info) => {
    console.log(info);
    res.render('./admin/accept-list', { admin: true, info, admins: req.session.admin })
  })
})
router.post('/accept', verifyAdminLogin, async (req, res) => {
  console.log(req.body);
  await admindb.Accept_Worker_Registration(req.body).then((id) => {
    admindb.Remove_Worker_Registration(req.body.wkid).then((data) => {
      res.redirect('/admin/accept')
    })
  })
})
router.get('/rejaccept', verifyAdminLogin, (req, res) => {
  admindb.Remove_Worker_Registration(req.query.id).then((info) => {
    res.redirect('/admin/accept')
  })
})
router.post('/login', (req, res) => {
  console.log(req.body);
  admindb.Do_admIn_LogIn(req.body).then((info) => {
    if (info) {
      console.log("info = ", info);
      req.session.admin = info
      req.session.admin.adminstatus = true

      res.redirect('/admin/')
    }
    else {
      req.session.adminfalse = true
      res.redirect('/admin/login')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.admin = null
  res.redirect('/admin/login')
})
router.get('/workers', verifyAdminLogin, (req, res) => {
  admindb.Get_Workers_Details().then((list) => {
    console.log(list);
    res.render('./admin/workers-list', { admin: true, admins: req.session.admin, list })
  })
})
router.get('/wkremove', verifyAdminLogin, (req, res) => {
  admindb.Remove_Worker(req.query.wkid).then(() => {
    res.redirect('/admin/workers')
  })
})
router.get('/users', verifyAdminLogin, (req, res) => {
  admindb.Get_Users_Details().then((list) => {
    console.log(list);
    res.render('./admin/users-list', { admin: true, admins: req.session.admin, list })
  })
})
router.get('/userremove', verifyAdminLogin, (req, res) => {
  admindb.Remove_Users(req.query.id).then(() => {
    res.redirect('/admin/users')
  })
})
router.get('/activity', verifyAdminLogin, (req, res) => {
  admindb.Get_all_activites().then((act) => {
    console.log(act);
    res.render('./admin/activity-page', { 
      admin: true, 
      admins: req.session.admin, 
      list: act,
      successMessage: req.session.activitySuccess,
      errorMessage: req.session.activityError
    })
    // Clear session messages after rendering
    req.session.activitySuccess = null;
    req.session.activityError = null;
  })
})

router.get('/delete-all-activities', verifyAdminLogin, async (req, res) => {
  try {
    await admindb.Delete_All_Activities();
    req.session.activitySuccess = 'All activities have been deleted successfully!';
    res.redirect('/admin/activity');
  } catch (error) {
    console.log(error);
    req.session.activityError = 'Failed to delete activities';
    res.redirect('/admin/activity');
  }
})

// Complaint Routes
router.get('/complaints', verifyAdminLogin, async (req, res) => {
  try {
    const complaints = await admindb.Get_All_Complaints();
    res.render('./admin/complaints-list', { 
      admin: true, 
      admins: req.session.admin, 
      complaints: complaints 
    });
  } catch (error) {
    console.log(error);
    res.redirect('/admin');
  }
});

router.post('/update-complaint', verifyAdminLogin, async (req, res) => {
  try {
    await admindb.Update_Complaint_Status(
      req.body.complaintId,
      req.body.status,
      req.body.adminResponse
    );
    res.redirect('/admin/complaints');
  } catch (error) {
    console.log(error);
    res.redirect('/admin/complaints');
  }
});

router.get('/delete-complaint', verifyAdminLogin, async (req, res) => {
  try {
    await admindb.Delete_Complaint(req.query.id);
    res.redirect('/admin/complaints');
  } catch (error) {
    console.log(error);
    res.redirect('/admin/complaints');
  }
});

// Work Pricing Routes
router.get('/work-prices', verifyAdminLogin, async (req, res) => {
  try {
    const prices = await admindb.Get_All_Work_Prices();
    res.render('./admin/work-prices', { 
      admin: true, 
      admins: req.session.admin, 
      prices: prices,
      success: req.session.priceSuccess,
      error: req.session.priceError
    });
    req.session.priceSuccess = null;
    req.session.priceError = null;
  } catch (error) {
    console.log(error);
    res.redirect('/admin');
  }
});

router.post('/add-work-price', verifyAdminLogin, async (req, res) => {
  try {
    const priceData = {
      workType: req.body.workType,
      dailyRate: parseFloat(req.body.dailyRate),
      hourlyRate: parseFloat(req.body.hourlyRate),
      description: req.body.description || '',
      createdAt: new Date()
    };
    await admindb.Add_Work_Price(priceData);
    req.session.priceSuccess = 'Work price added successfully!';
    res.redirect('/admin/work-prices');
  } catch (error) {
    console.log(error);
    req.session.priceError = error.error || 'Failed to add work price';
    res.redirect('/admin/work-prices');
  }
});

router.post('/update-work-price', verifyAdminLogin, async (req, res) => {
  try {
    const priceData = {
      dailyRate: parseFloat(req.body.dailyRate),
      hourlyRate: parseFloat(req.body.hourlyRate),
      description: req.body.description || '',
      updatedAt: new Date()
    };
    await admindb.Update_Work_Price(req.body.workType, priceData);
    req.session.priceSuccess = 'Work price updated successfully!';
    res.redirect('/admin/work-prices');
  } catch (error) {
    console.log(error);
    req.session.priceError = 'Failed to update work price';
    res.redirect('/admin/work-prices');
  }
});

router.get('/delete-work-price', verifyAdminLogin, async (req, res) => {
  try {
    await admindb.Delete_Work_Price(req.query.workType);
    req.session.priceSuccess = 'Work price deleted successfully!';
    res.redirect('/admin/work-prices');
  } catch (error) {
    console.log(error);
    req.session.priceError = 'Failed to delete work price';
    res.redirect('/admin/work-prices');
  }
});

// Payment History Route for Admin
router.get('/payment-history', verifyAdminLogin, async (req, res) => {
  try {
    const payments = await admindb.Get_All_Payments();
    res.render('./admin/payment-history', { 
      admin: true, 
      admins: req.session.admin, 
      payments: payments 
    });
  } catch (error) {
    console.log('Payment history error:', error);
    res.redirect('/admin');
  }
});

module.exports = router;
