const dotenv = require('dotenv');
const express = require("express");
const multer = require('multer');
const cloudinary = require('cloudinary').v2
const cors = require('cors')
const app = express();
const nodemailer = require('nodemailer');
app.use(express.json());
const appointmentsRoutes = require('./api/appointments'); 
app.use('/api/appointments', appointmentsRoutes);
const authorizationRoutes = require('./api/authorization')
app.use('/api/authorization', authorizationRoutes);
dotenv.config();

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
app.use(cors({
    origin : ["http://localhost:3000","https://hospital.vercel.app"],
    methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    credentials: true
}))
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
const storage = multer.memoryStorage(); 
const upload = multer({ storage });

//---------------------------------Cloud-----------------------------------------
app.post("/upload", upload.single("image"), async (req, res) => {
    console.log("Received request for file upload");

    try {
        if (!req.file) {
            console.log("No file uploaded");
            return res.status(400).json({ error: "No image uploaded" });
        }

        console.log("Uploading to Cloudinary...");
        const result = await cloudinary.uploader.upload_stream(
            { folder: "uploads" },
            (error, result) => {
                if (error) {
                    console.log("Cloudinary upload failed:", error);
                    return res.status(500).json({ error: "Cloudinary upload failed" });
                }
                console.log("Upload successful:", result);
                res.json({ imageUrl: result.secure_url });
            }
        ).end(req.file.buffer);

    } catch (error) {
        console.log("Server error:", error);
        res.status(500).json({ error: "Server error" });
    }
});
//---------------------------------Mail-----------------------------------------
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = (email) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'DBMS Hospital',
        text: "Welcome to Hospital",
    };
    console.log(mailOptions);
    return transporter.sendMail(mailOptions);
}
app.post("/mailer", async(req,res)=>{
    try
    {
        console.log(req.body);
        const {email} = req.body; 
        console.log("calling send email");
        await sendEmail(email);
        console.log("email sent successfully"); 
        res.status(200).json(
            {
                "status":"Done"
            })
    }
    catch(e)
    {
        console.error(e);
        res.status(400).json({
            error:e.message
        });
    }
})

app.get('/', (req, res) => 
{  
    return res.status(200).json({
        "status": "success"
    });
});

app.get('/test', async (req, res) => 
{
    try 
    {
        const { data, error } = await supabase
            .from('test_table')
            .select('*');
        
        if (error) 
        {
            return res.status(500).json({ error: error.message });
        }
        res.json({ data });
    } 
    catch (err) 
    {
        res.status(500).json({ error: err.message });
    }
});

//----------------------------------------------appointmentapi--------------------------
/*
app.post("/api/appointments/book",async (req,res)=>
    {
        const { patientID, doctorID, date, time } = req.body
        try
        {
            const {data,error} = await supabase
            .from('appointments')
            .insert([{ patientid: patientID, doctorid: doctorID, date:date, time:time }])
            .select('appointmentid')
            if(error){
                console.error('Supabase insert error:',error);
                return res.status(505).json({err:err.message})
            }
            //console.log(data[0].appointmentid)
            return res.status(200).json({"success":true,appointmentid:data[0].appointmentid})
        }
        catch(err)
        {
            return res.status(505).json({err:err.message})
        }
    })

app.get("/api/appointments/:id",async (req,res)=>{
    const {id} = req.params;
    try{
        const {data,error} = await supabase
        .from('appointments')
        .select('*')
        .eq('appointmentid',id)
        .single()

        if (error) {
            console.error('Supabase fetch error:', error);
            return res.status(500).json({ error: error.message });
        }
      
        if (!data) {
            return res.status(404).json({ error: "Appointment not found" });
        }
      
        return res.status(200).json({ appointmentDetails: data });
    }
    catch(err){
        return res.status(500).json({err:err.message})
    }
})
app.delete("/api/appointments/:id/cancel",async (req,res)=>
    {
        const {id} = req.params;
        try{
            const {data,error} = await supabase
            .from('appointments')
            .select('*')
            .eq('appointmentid',id)
            .single()
            if (error|| data == null) 
            {
                return res.status(404).json({ error: "Appointment not found" });
            }
            const {inserterror} = await supabase
            .from('appointments')
            .delete()
            .eq('appointmentid',id)

            if (inserterror) {
                console.error("Supabase delete error:", inserterror);
                return res.status(500).json({ error: inserterror.message });
            }
            return res.status(200).json({"success":true})
        }catch(err){
            return res.status(500).json({err:err.message})
        }

    })
*/
app.listen(8080, () => 
{
    console.log("listening on port 8080");
});
