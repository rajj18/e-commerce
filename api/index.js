const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const port = 8000;
const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended:false}));
app.use(bodyParser.json());

const jwt = require('jsonwebtoken');

// mongodb+srv://raj18:<password>@cluster0.ighdtjq.mongodb.net/
mongoose.connect('mongodb+srv://raj18:1010@cluster0.ighdtjq.mongodb.net/',{
    useNewUrlParser : true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.log('error i nconnecting', err);
})


app.listen(port, () => {
    console.log('Server is runing on port 8000');
})

const User = require('./modals/user');
const Order = require('./modals/order');

// function to send verification email to the user
const sendVerificationEmail = async(email,verificationToken) => {
    // create a nodemailer transport
    const transporter = nodemailer.createTransport({
        // configure the email service
        service: 'gmail',
        auth:{
            user:'rajhansj18@gmail.com',
            pass:'rgjs llal zjgf ohgt'
        },
    });

    // compose the email message
    const mailOptions = {
        from:'ecommerce.com',
        to: email,
        subject: 'Email Verification',
        text: `Please click on the following link to verify your email: http://localhost:8000/verify/${verificationToken}`,
    };

    // send the email
    try{
        await transporter.sendMail(mailOptions);
    }catch(error){
        console.log('Error sending verificaion email', error);
    }
}

// endpoint to register in app
app.post('/register',async(req,res) => {
    try{
        const {name,email,password} = req.body;

        //check if email is already registered
        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(400).json({message:'Email already registered'});
        }

        // create new user
        const newUser = new User({name,email,password});

        // generate and store verification token
        newUser.verificationToken = crypto.randomBytes(20).toString("hex");

        // save the user to database
        await newUser.save();

        // send verification mail to the user
        sendVerificationEmail(newUser.email,newUser.verificationToken);

        res.status(201).json({
            message:
              "Registration successful. Please check your email for verification.",
          });
    } catch(error){
        console.log('error registering user',error);
        res.status(500).json({message:'Registeration failed'})
    }
})


// endpoit to verify email
app.get("/verify/:token", async (req, res)=>{
    try{
        const token = req.params.token;

        // find the user with the given verification token
        const user = await User.findOne({verificationToken: token});
        if(!user){
            return res.status(404).json({message:'Invalid verification token'});
        }

        // mark the user as verified
        user.verified = true;
        user.verificationToken = undefined;

        await user.save();

        res.status(200),json({message:'Email verification successful'})
    } catch(error){
        console.log({message:'Email verificaion failed'});
    };
});

