const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const multer = require('multer');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({storage:storage})

// Connect to MongoDB
mongoose.connect(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mern-job-portal.ghsgt3o.mongodb.net/quizApp?retryWrites=true&w=majority`,
);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  firstName:{
    type: String,
    required: true,
  },
  lastName:{
    type: String,
  },
  otp: {
    type: String,
  },
  password: {
    type: String,
  }
});

const User = mongoose.model("User", userSchema);

const jobCollectionsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  CTC: {
    type: String,
    required: true,
  },
  salaryType: String,
  jobLocation: String,
  postingDate: Date,
  jobType: String,
  companyLogo: String,
  employmentType: String,

  description: {
    type: String,
    required: true,
  },
  postedBy: String,

  experienceRequired:{
    type:String,
    required: true,
  },

  applyBy:{
    type:String,
    required: true,
  },

  salaryDetails:{
    type:String,
  },

  aboutCompany:{
    type:String,
  },

  workArrangement:{
    type:String,
  },

  skillsRequired:{
    type:String,
  }
  
});

const resumeSchema = new mongoose.Schema({
  fieldname: String,
  originalname: String,
  encoding: String,
  mimetype: String,
  buffer: Buffer,
  size: Number,
});

const applicantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Assuming you are using MongoDB ObjectIds for userId
    ref: 'User', // Reference to the User model (replace 'User' with your actual User model name)
    required : true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId, // Assuming you are using MongoDB ObjectIds for jobId
    ref: 'JobCollections', // Reference to the Job model (replace 'Job' with your actual Job model name)
    required : true,
  },
  resume: {
    type : resumeSchema,
    require : true,
  },
});

const Applicant = mongoose.model('Applicant', applicantSchema);

const JobCollections = mongoose.model('JobCollections', jobCollectionsSchema);

const secretKey = "s3cr3tk3y"

const authenticateUserJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        console.log(err);
        return res.sendStatus(403);
      }
      req.user = user;
      console.log(user);
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.get('/user', authenticateUserJwt, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.email });
    user.password = "";
    res.json({ user });
  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post("/register", async (req, res) => {
  try {
    console.log(req.body);
    const { email,firstName } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

    // Save user details to the database
    const newUser = new User({
      email,
      otp,
      firstName,
    });
    await newUser.save();

    // Send OTP to the user's email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "mwankhade718@gmail.com", // Your Gmail email address
        pass: "zxbu qyrr yizg izzr", // Your Gmail password or an application-specific password
      },
    });

    const mailOptions = {
      from: "mwankhade718@gmail.com",
      to: email,
      subject: "OTP for Registration",
      text: `Your OTP for registration is ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to send OTP" });
      }
      res.status(200).json({ message: "OTP sent successfully" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/user/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (user) {
      const token = jwt.sign({ userId: user._id }, secretKey, {
        expiresIn: "1d",
      });
      console.log('logged in successfully');
      res.json({ message: 'Logged in successfully', token });
    } else {
      res.status(403).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    console.log(req.body);

    const { email, otp } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Verify the provided OTP against the stored OTP in the user document
    const isOtpValid = otp && user.otp === otp;

    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Clear the OTP in the user document after successful login (optional for one-time use)
    user.otp = undefined;
    await user.save();

    // Generate a JWT token for authentication
    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "1d",
    });

    res.status(200).json({ token, userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/set-password', authenticateUserJwt, async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { password } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      user_id ,
      { password },
      { new: true } 
    );

    if (updatedUser) {
      res.status(200).json({ message: 'Password set successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// post a job
app.post('/post-job', async (req, res) => {
  const body = req.body;
  console.log(body);
  body.postingDate = new Date();
  try {
    const result = await JobCollections.create(body);
    return res.status(200).send(result);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      message: "Can not insert! Try again later",
      status: false,
    });
  }
});

// get all jobs
app.get('/all-jobs', async (req, res) => {
  try {
    const jobs = await JobCollections.find();
    res.send(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: 'Internal Server Error',
      status: false,
    });
  }
});

app.get('/get-job/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await JobCollections.findById(jobId);
    res.send(job);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: 'Internal Server Error',
      status: false,
    });
  }
});

//get jobs by email
app.get("/myJobs/:email", async(req, res) => {
  const jobs = await JobCollections.find({postedBy : req.params.email}).toArray();
})


app.post('/resume-upload/:id', authenticateUserJwt, upload.single('resumePdf'), async (req, res) => {
  const resume = req.file;
  const jobId = req.params.id;
  const userId = req.user.userId;

  try {
    // Check if there is an existing applicant with the same job ID and user ID
    let existingApplicant = await Applicant.findOne({ userId, jobId });

    if (existingApplicant) {
      // If applicant exists, update the resume field
      existingApplicant.resume = resume;
      const updatedResult = await existingApplicant.save();
      return res.status(200).send(updatedResult);
    } else {
      // If no existing applicant, create a new one
      const newApplicant = new Applicant({
        userId,
        jobId,
        resume
      });

      const result = await newApplicant.save();
      return res.status(200).send(result);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send({
      message: "Internal Server Error",
      status: false,
    });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
