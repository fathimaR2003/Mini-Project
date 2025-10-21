var express = require("express");
var router = express.Router();
var userdb = require("../database/userbase");
var workerdb = require("../database/workerbase");
var admindb = require("../database/adminbase");

var verfylogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */
router.get("/", function (req, res, next) {
  if (req.session.user) {
    res.render("./user/first-page", { fuser: req.session.user });
  } else {
    res.render("./user/first-page");
  }
});
router.get("/signup", (req, res) => {
  if (req.session.em) {
    res.render("./user/signup-page", {
      user: true,
      errmsg: "This Mail Address Is Already Exist",
    });
    req.session.em = false;
  } else {
    res.render("./user/signup-page",);
  }
});
router.post("/signup", (req, res) => {
  userdb.ChecK_the_Email_aleady_exist_Or_NOt(req.body.email).then((status) => {
    if (status) {
      //console.log(req.body);
      userdb.Do_Signup_By_Users(req.body).then((id) => {
        res.redirect("/login");
      });
    } else {
      req.session.em = true;
      res.redirect("/signup");
    }
  });
});
router.get("/login", (req, res) => {
  if (req.session.false) {
    res.render("./user/login-page", {
      err: "Incorrect Username or Password",
    });
    req.session.false = false;
  } else {
    res.render("./user/login-page");
  }
});

router.post("/login", (req, res) => {
  userdb.Do_Login_By_The_USer(req.body).then((info) => {
    if (info.state) {
      req.session.user = info.user;
      req.session.user.state = true;
      res.redirect("/");
    } else {
      console.log("Hello");
      req.session.false = true;
      res.redirect("/login");
    }
  });
});
router.get("/logout", (req, res) => {
  console.log("Hello");
  req.session.user = null;
  res.redirect("/login");
});
router.get("/services", verfylogin, async (req, res) => {
  const { wrktype, workers } = await userdb.Get_Work_type_forSearch()
  console.log(workers);

  res.render("./user/services", { user: true, fuser: req.session.user, wrktype: JSON.stringify(wrktype), workers });
});
router.post("/services", verfylogin, (req, res) => {
  userdb.FInd_Worker_By_THEUser(req.body).then((wks) => {
    console.log(wks);
    res.render("./user/workers-list", {
      user: true,
      wks,
      fuser: req.session.user,
    });
  });
});
router.get("/morewkinfo", verfylogin, (req, res) => {
  userdb.Individual_Worker_Info(req.query.id).then((info) => {
    userdb.Get_User_Feedback_AND_ratiNg(req.query.id).then((list) => {
      workerdb.Get_Updated_profile_details(req.query.id).then((wklist) => {
        userdb
          .Check_Wether_the_User_already_requestedORNot(
            req.session.user._id,
            req.query.id
          )
          .then((infos) => {
            console.log(wklist[0]);

            if (infos.msg) {
              res.render("./user/worker-page", {
                user: true,
                fuser: req.session.user,
                info,
                msg: infos.msg,
                list,
                wrklist: wklist[0],
                allwrks: wklist
              });
            } else {
              res.render("./user/worker-page", {
                user: true,
                fuser: req.session.user,
                info,
                list,
                wrklist: wklist[0],
                allwrks: wklist
              });
            }
          });
      });
    });
  });
});
router.get("/request", (req, res) => {
  console.log(req.query);
  userdb
    .User_Send_request_TO_WorKEr(
      req.session.user._id,
      req.query.id,
      req.query.type
    )
    .then((info) => {
      res.redirect(`/requests`);
    });
});
router.get("/requests", verfylogin, (req, res) => {
  userdb.Get_List_OF_user_Requests(req.session.user._id).then((list) => {
    console.log(list);

    res.render("./user/request-list", {
      user: true,
      fuser: req.session.user,
      list,
    });
  });
});
router.get("/removereq", verfylogin, (req, res) => {
  userdb
    .Remove_WorkersUser_Request_By_user(req.session.user._id, req.query.wkid)
    .then((data) => {
      res.redirect("/requests");
    });
});
router.get("/confirm", verfylogin, (req, res) => {
  userdb.User_confirmation_LIsT(req.session.user._id).then((list) => {
    console.log(list);

    res.render("./user/confirm-list", {
      user: true,
      fuser: req.session.user,
      list,
    });
  });
});
router.get("/removeconfirm", async (req, res) => {
  await userdb
    .Remove_Details_From_Accept_BAsE(req.session.user._id, req.query.wkid)
    .then((data1) => {
      userdb
        .Remove_Details_From_Request_BAsE(req.session.user._id, req.query.wkid)
        .then((data2) => {
          res.redirect("/confirm");
        });
    });
});
router.get("/yourwks", verfylogin, (req, res) => {
  res.render("./user/confirm-list", { user: true, fuser: req.session.user });
});

router.get("/acceptconfirm", async (req, res) => {

  const { price } = await userdb.get_WorkerPrice_ForOrder_AND_UserDetais(req.query.wkid)

  await userdb
    .Remove_Type_and_User_WIth_WorkersFroM_Request_base(
      req.session.user._id,
      req.query.type
    )
    .then(async (data1) => {
      await userdb
        .Remove_Type_and_User_WIth_WorkersFroM_Accept(
          req.session.user._id,
          req.query.type
        )
        .then(async (data2) => {
          await userdb
            .Insert_Data_After_User_ConfirMatIOn(
              req.session.user._id,
              req.query.wkid,
              req.query.type,
              price
            )
            .then((data3) => {
              //res.redirect("/yourwks");
              res.render("./user/payment-page",
                {
                  price: price,
                  userName: req.session.user.name,
                  fuser: req.session.user,
                  user: true,

                }
              );
            });
        });
    });

  console.log(req?.session?.user);

  // console.log(req.session.user._id,
  //   req.query.wkid,
  //   req.query.type);

});
router.get("/activities", verfylogin, (req, res) => {
  userdb.Get_User_Current_Activites(req.session.user._id).then((list) => {
    console.log(list.length);
    res.render("./user/activity-page", {
      user: true,
      fuser: req.session.user,
      list,
    });
  });
});
router.get("/history", verfylogin, (req, res) => {
  console.log(req.session.user._id);

  userdb.Get_User_Current_Activiteshistory(req.session.user._id).then((list) => {
    console.log(list);

    res.render("./user/work-history", {
      user: true,
      fuser: req.session.user,
      list,
    });
  });
});
router.post("/feedback", verfylogin, (req, res) => {
  userdb
    .Upload_Feedback_AND_RatinG(req.session.user._id, req.query.wkid, req.body)
    .then(async (data) => {
      await userdb.Find_Total_Rating(req.query.wkid).then(async (total) => {
        await userdb.Find_Total_Star_coUnt(req.query.wkid).then((len) => {
          var avg = parseInt(total / len);
          console.log(avg, total, len);
          userdb.Update_Worker_Rating(req.query.wkid, avg).then((data) => {
            res.redirect("/activities");
          });
        });
      });
      var img1 = req.files.img1;
      var img2 = req.files.img2;
      var img3 = req.files.img3;
      if (img1) {
        await img1.mv(
          "public/user-workes/" + req.session.user._id + "1.jpg",
          (err, data) => {
            if (err) {
              console.log(err);
            }
          }
        );
      }
      if (img2) {
        await img2.mv(
          "public/user-workes/" + req.session.user._id + "2.jpg",
          (err, data) => {
            if (err) {
              console.log(err);
            }
          }
        );
      }
      if (img3) {
        await img3.mv(
          "public/user-workes/" + req.session.user._id + "3.jpg",
          (err, data) => {
            if (err) {
              console.log(err);
            }
          }
        );
      }
    });
});

// Payment Routes
router.get('/payment', verfylogin, async (req, res) => {
  try {
    const workerId = req.query.wkid;

    // Get worker information
    const worker = await workerdb.Get_Worker_By_Id(workerId);

    if (!worker) {
      return res.redirect('/activities');
    }

    // Get work price from admin settings
    const priceData = await admindb.Get_Work_Price_By_Type(worker.profession);

    if (!priceData) {
      console.log('Price not set for work type:', worker.profession);
      return res.redirect('/activities');
    }

    const basePrice = priceData.price;
    const gst = Math.round(basePrice * 0.18);
    const totalAmount = basePrice + gst;

    res.render('./user/payment', {
      user: true,
      users: req.session.user,
      worker: worker,
      basePrice: basePrice,
      gst: gst,
      totalAmount: totalAmount
    });
  } catch (error) {
    console.log('Payment page error:', error);
    res.redirect('/activities');
  }
});

router.post('/process-payment', verfylogin, async (req, res) => {
  try {
    const { workerId, workType, totalAmount, paymentMethod, cardNumber, cardName, expiryDate, cvv } = req.body;

    // Generate unique invoice number
    const invoiceNumber = 'INV-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    // Create payment record
    const paymentData = {
      userId: req.session.user._id,
      workerId: workerId,
      workType: workType,
      amount: parseFloat(totalAmount),
      paymentMethod: paymentMethod.toUpperCase(),
      invoiceNumber: invoiceNumber
    };

    const paymentId = await userdb.Create_Payment_Record(paymentData);

    // Get worker details for receipt
    const worker = await workerdb.Get_Worker_By_Id(workerId);

    // Calculate breakdown
    const total = parseFloat(totalAmount);
    const basePrice = Math.round(total / 1.18);
    const gst = total - basePrice;

    // Format date
    const paymentDate = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    res.render('./user/payment-receipt', {
      user: true,
      users: req.session.user,
      worker: worker,
      invoiceNumber: invoiceNumber,
      paymentDate: paymentDate,
      workType: workType,
      basePrice: basePrice,
      gst: gst,
      totalAmount: total,
      paymentMethod: paymentMethod.toUpperCase(),
      paymentId: paymentId
    });
  } catch (error) {
    console.log('Process payment error:', error);
    res.redirect('/activities');
  }
});

router.get('/submit-feedback', verfylogin, async (req, res) => {
  try {
    const workerId = req.query.wkid;
    const paymentId = req.query.paymentId;

    // Verify payment exists
    const payment = await userdb.Get_Payment_By_Id(paymentId);

    if (!payment) {
      console.log('Payment not found');
      return res.redirect('/activities');
    }

    // Get worker information
    const worker = await workerdb.Get_Worker_By_Id(workerId);

    res.render('./user/submit-feedback', {
      user: true,
      users: req.session.user,
      worker: worker
    });
  } catch (error) {
    console.log('Submit feedback page error:', error);
    res.redirect('/activities');
  }
});

// Complaint Routes
router.get('/complaints', verfylogin, async (req, res) => {
  try {
    const complaints = await userdb.Get_User_Complaints(req.session.user._id);
    res.render('./user/complaints', {
      user: true,
      users: req.session.user,
      complaints: complaints
    });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

router.get('/submit-complaint', verfylogin, async (req, res) => {
  try {
    // Get user's work history to select workers they've worked with
    const workHistory = await userdb.Get_User_Current_Activiteshistory(req.session.user._id);

    const seenWkids = new Set();
    const uniqueWorkHistory = workHistory.filter(item => {
      const wkid = item.workers?.wkid?.toString();
      if (seenWkids.has(wkid)) {
        return false;  // Duplicate found → skip
      }
      seenWkids.add(wkid);
      return true;      // First time → keep
    });

    console.log(uniqueWorkHistory);


    // Get all work prices
    const workPrices = await admindb.Get_All_Work_Prices();
    res.render('./user/submit-complaint', {
      user: true,
      users: req.session.user,
      workers: uniqueWorkHistory,
      workPrices: workPrices
    });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

router.post('/submit-complaint', verfylogin, async (req, res) => {
  try {
    const complaintData = {
      userId: req.session.user._id,
      workerId: req.body.workerId,
      workerType: req.body.workerType,
      workDate: req.body.workDate,
      subject: req.body.subject,
      complaint: req.body.complaint
    };

    await userdb.Submit_Complaint_About_Worker(complaintData);
    res.redirect('/complaints');
  } catch (error) {
    console.log(error);
    res.redirect('/submit-complaint');
  }
});

// Payment History Route for Users
router.get('/payment-history', verfylogin, async (req, res) => {
  try {
    const payments = await userdb.Get_User_Payments(req.session.user._id);
    res.render('./user/payment-history', {
      user: true,
      users: req.session.user,
      payments: payments
    });
  } catch (error) {
    console.log('Payment history error:', error);
    res.redirect('/');
  }
});

// Pricing page route
router.get('/pricing', async (req, res) => {
  try {
    const workPrices = await admindb.Get_All_Work_Prices();
    if (req.session.user) {
      res.render('./user/pricing', {
        fuser: req.session.user,
        workPrices: workPrices
      });
    } else {
      res.render('./user/pricing', {
        workPrices: workPrices
      });
    }
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

router.get("/showOrderPage", verfylogin, (req, res) => {

  try {

    res.render("./user/payment-page");


  } catch (error) {
    return res.status(400).json(error)
  }

})


module.exports = router;
