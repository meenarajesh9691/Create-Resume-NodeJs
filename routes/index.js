var express = require('express');
var router = express.Router();
const nodemailer = require("nodemailer");
const upload = require("../helpers/multer").single("avatar");;
const fs = require("fs");
// schema import 
const User = require("../models/userModel");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const multer = require('multer');
passport.use(new LocalStrategy(User.authenticate()));



/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'ResumeMaker | Homepage ', isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

router.get("/create", isLoggedIn, (req, res, next) => {
  res.render("create", {
    title: "ResumeMaker | Create ", isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

router.get("/show", isLoggedIn, (req, res, next) => {
  // console.log(req.user);
  res.render("show", {
    title: "ResumeMaker | Show ", isLoggedIn: req.user ? true : false,
    data: req.user,
  });
});

router.get("/signin", async (req, res, next) => {
  const user = await User.findOne();
  res.render("signin", {
    title: "ResumeMaker | Signin ", isLoggedIn: req.user ? true : false,
    user,
  });
  //  console.log(user);
});

router.get("/signup", (req, res, next) => {
  res.render("signup", {
    title: "ResumeMaker | Signup ", isLoggedIn: req.user ? true : false,
    user: req.user,
  });
});

router.post("/signup", (req, res, next) => {
  const { username, email, password, contact } = req.body;
  User.register({ username, email, contact }, password)
    .then((user) => {
      res.redirect("/signin");
    })
    .catch((err) => {
      res.send(err);
    });
});

// router.post("/signinuser",
// passport.authenticate("local", {
//     // successRedirect: "/profile", 
//     failureRedirect: "/signin",
//   }), async function (req, res, next) {
//     const user = await User.findOne();
//     // console.log(user);
//     res.redirect("/profile");

//   }

// );

router.post("/signinuser", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/signin",
}), function (req, res, next) { }
);


// router.get("/profile/:id", isLoggedIn, async (req, res, next) => {
//   const user = await User.findById(req.params.id);
//   res.render("profile", { title: " Profile ", user });
//   // console.log(user);
// });

router.get("/profile", isLoggedIn, async function (req, res, next) {
  res.render("profile", { title: "Profile", user: req.user, });
  // console.log(req.user);
});


router.post("/upload",isLoggedIn, upload, async (req, res, next) => {
  // console.log(req.file);
  try {
      if (req.file) {
        if(req.user.avatar !== "default.png"){

          fs.unlinkSync("./public/images/" + req.user.avatar);
        }
          req.user.avatar = req.file.filename;
          await req.user.save();
          res.redirect("/profile");
      }
  } catch (error) {
      res.send(error);
  }

});


// router.post("/upload", isLoggedIn, async function (req, res, next) {
//   upload(req, res, function (err) {
//       if (err) {
//           console.log("ERROR>>>>>", err.message);
//           res.send(err.message);
//       }
//       if (req.file) {
//           // fs.unlinkSync("./public/images/" + req.user.avatar);
//           req.user.avatar = req.file.filename;
//           req.user
//               .save()
//               .then(() => {
//                   res.redirect("/profile");
//               })
//               .catch((err) => {
//                   res.send(err);
//               });
//       }
//   });
// });



router.get("/signout", isLoggedIn, (req, res, next) => {
  req.logOut(() => {
    res.redirect("/signin");
  });
});



router.get("/resetpassword/:id",  async (req, res, next) => {
  const user = await User.findById(req.params.id);
  // console.log(user);
  res.render("reset",
    {
      title: "Reset Password",
      isLoggedIn: req.user ? true : false,
      user,
    });
});

router.post("/resetuser/:id", isLoggedIn, async (req, res, next) => {
  try {
    await req.user.changePassword(
      req.body.oldPassword,
      req.body.newPassword
    );
    await req.user.save();
    res.redirect("/signin");
  } catch (error) {
    res.send(error);
  }

});

router.get("/forgetpassword", async (req, res, next) => {
  // const user = await User.findOne();
  res.render("forgetpassword", { title: "Send Mail" });
  // console.log(user);
});


//-----------Send Mail by OTP----------

//post send mail
router.post("/send-mail", async (req, res, next) => {
  const user = await User.findOne();
  // console.log(user);
  if (!user) return res.send("user not found");

  const otp = Math.floor(Math.random() * 9000 + 1000);

  //------Node Mailer coding-------

  const transport = nodemailer.createTransport({
    service: "gamil",
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: "rajesh.meena1010@gmail.com",
      pass: "hvetpuspfefrtcqs",
    },
  });

  const mailOptions = {
    from: "rajesh.meena1010@gmail.com",
    to: req.body.email,
    subject: "Password Reset OTP",
    text: "Do not share this OTP to anyone.",
    html: `<p>Do not share this OTP to anyone.</p><h1>${otp}</h1>`,
  };

  transport.sendMail(mailOptions, async (err, info) => {
    if (err) {
      return res.send(err);
    } else {
      console.log(info);
    }


    await User.findByIdAndUpdate(user._id, { otp });

    res.redirect("/otp/" + user._id);
  });

});



// code get method
router.get("/otp/:id", async (req, res, next) => {
  const user = await User.findOne();
  res.render("otp", { title: 'OTP', user });
  // console.log(user);
});
// code post method
router.post("/otp/:id", async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (user.otp == req.body.otp) {
    await User.findByIdAndUpdate(user._id, { otp: "" });
    res.redirect("/resetpassword/" + user._id);
  } else {
    res.send("Invalid otp.");
  }
});




//---------Send Mail by link ---------------

// /* POST send-mail page. */
// router.post("/send-mail", async function (req, res, next) {
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) return res.send("user not found");

//   const mailurl = `${req.protocol}://${req.get("host")}/forgetpassword/${
//       user._id
//   }`;
//   // const code = Math.floor(Math.random() * 9000 + 1000);

//   // -----Node mailer coding--------------

//   const transport = nodemailer.createTransport({
//       service: "gmail",
//       host: "smtp.gmail.com",
//       port: 465,
//       auth: {
//           user: "rajesh.meena1010@gmail.com",
//           pass: "hvetpuspfefrtcqs",
//       },
//   });

//   const mailOptions = {
//       // from: "Dhanesh Pvt. Ltd.<dhanesh1296@gmail.com>",
//       from:"rajesh.meena1010@gmail.com",
//       to: req.body.email,
//       subject: "Password Reset Link",
//       text: "Do not share this link to anyone.",

//       html: `<a href=${mailurl}>Password Reset Link</a>`,

//       // html: `<p>Do not share this Code to anyone.</p><h1>${code}</h1>`,
//   };

//   transport.sendMail(mailOptions, async (err, info) => {
//       if (err) return res.send(err);
//       console.log(info);

//       // await User.findByIdAndUpdate(user._id, { code });

//       return res.send(
//           "<h1 style='text-align:center;color: tomato; margin-top:10%'><span style='font-size:60px;'>✔️</span> <br />Email Sent! Check your inbox , <br/>check spam in case not found in inbox.</h1> <br> <a href='/signin'>Signin</a>"
//       );
//       // res.redirect("/code/" + user._id);
//   });
// });

// /* GET forgetpassword page. */
// router.get("/forgetpassword/:id", async function (req, res, next) {
//   res.render("getpassword", { title: "Forget Password", id: req.params.id });
// });

// /* POST forgetpassword page. */
// router.post("/forgetpassword/:id", async function (req, res, next) {
//   await User.findByIdAndUpdate(req.params.id, req.body);
//   res.redirect("/signin");
// });



router.get("/update/:id", isLoggedIn, (req, res, next) => {
  res.render("update", {
      title: "Update Resume",
      user: req.user,
  });
});

router.post("/update/:id", isLoggedIn, async (req, res, next) => {
  try {
      const { username, email, contact, linkedin, github, behance } = req.body;

      const updateUserInfo = {
          username, email, contact,
          links: {
              linkedin,
              github,
              behance,
          },

      };

      await User.findByIdAndUpdate(req.params.id, updateUserInfo);
      res.redirect("/update/" + req.params.id);
  } catch (error) {
      res.send(error);
  }
});
// ----------------Create Resume--------------------

router.get("/education", isLoggedIn, function (req, res, next) {
  res.render("Resume/Education", {
      title: "Education",
      isLoggedIn: req.user ? true : false,
      user: req.user,
  });
});

router.post("/add-edu", isLoggedIn, async function (req, res, next) {
  req.user.education.push(req.body);
  await req.user.save();
  res.redirect("/education");
});

router.get("/delete-edu/:index", isLoggedIn, async function (req, res, next) {
  const eduCopy = [...req.user.education];
  eduCopy.splice(req.params.index, 1);
  req.user.education = [...eduCopy];
  await req.user.save();
  res.redirect("/education");
});


router.get("/Skill", isLoggedIn, function (req, res, next) {
  res.render("Resume/Skill", {
      title: "Skill",
      isLoggedIn: req.user ? true : false,
      user: req.user,
  });
});

router.post("/add-skill", isLoggedIn, async(req,res,next)=>{
  req.user.skill.push(req.body);
  await req.user.save();
  res.redirect("/Skill");
});

router.get("/delete-skill/:index", isLoggedIn, async(req,res,next)=>{
  const skillCopy = [...req.user.skill];
  skillCopy.splice(req.params.index,1);
  req.user.skill = [...skillCopy];
  await req.user.save();
  res.redirect("/Skill");

});

router.get("/Project", isLoggedIn, function (req, res, next) {
  res.render("Resume/Project", {
      title: "Project",
      isLoggedIn: req.user ? true : false,
      user: req.user,
  });
});

router.post("/add-project", isLoggedIn, (req,res,next)=>{
  req.user.project.push(req.body);
  req.user.save();
  res.redirect("/Project");
});

router.get("/delete-project/:index", isLoggedIn, async function (req, res, next) {
  const projectCopy = [...req.user.project];
  projectCopy.splice(req.params.index, 1);
  req.user.project = [...projectCopy];
  await req.user.save();
  res.redirect("/Project");
});


router.get("/Experience", isLoggedIn, function (req, res, next) {
  res.render("Resume/Experience", {
      title: "Experience",
      isLoggedIn: req.user ? true : false,
      user: req.user,
  });
});

router.post("/add-experience",isLoggedIn,(req,res,next)=>{
  req.user.experience.push(req.body);
  req.user.save();
  res.redirect("/experience");
});

router.get("/delete-experience/:index",isLoggedIn,(req,res,next)=>{
  const exCopy = [...req.user.experience];
  exCopy.splice(req.user.index, 1);
  req.user.experience = [...exCopy];
  req.user.save();
  res.redirect("/Experience");
});
router.get("/Interest", isLoggedIn, function (req, res, next) {
  res.render("Resume/Interest", {
      title: "Interest",
      isLoggedIn: req.user ? true : false,
      user: req.user,
  });
});

router.post("/add-interest", isLoggedIn, (req,res,next)=>{
  req.user.interest.push(req.body);
  req.user.save();
  res.redirect("/interest");
});

router.get("/delete-interest/:index", async(req,res,next)=>{
  const intCopy = [...req.user.interest];
  intCopy.splice(req.user.index,1);
  req.user.interest = [...intCopy];
  await req.user.save();
  res.redirect("/Interest");

});



function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/signin");
  }
}

module.exports = router;
