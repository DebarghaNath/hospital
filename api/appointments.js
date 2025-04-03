const dotenv = require('dotenv');
dotenv.config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const express = require('express')
const router = express.Router();
const sendEmail = require('./mailer');
const { promises } = require('nodemailer/lib/xoauth2');

async function Mail(doctorID, patientID, date, time) {
   // console.log("patientID:", patientID);
    //console.log("doctorID:", doctorID);
    
    let patientEmail, doctorEmail;
    let patientName,doctorName;
    try {
        const { data: pdata, error: perror } = await supabase
            .from('patients')
            .select('*')
            .eq('patientid', patientID);
        
        if (perror) {
            console.error("Patient fetch error:", perror);
            throw new Error(perror.message);
        }
        
        if (!pdata || pdata.length === 0) {
            throw new Error("Patient email not found");
        }
        console.log(pdata[0])

        patientEmail = pdata[0].email;
        patientName = pdata[0].patientname
    } catch (err) {
        console.error("Error fetching patient email:", err);
        throw err;
    }
    
    try {
        const { data: ddata, error: derror } = await supabase
            .from('doctors')
            .select('*')
            .eq('doctorid', doctorID);
        
        if (derror) {
            console.error("Doctor fetch error:", derror);
            throw new Error(derror.message);
        }
        
        if (!ddata || ddata.length === 0) {
            throw new Error("Doctor email not found");
        }
        console.log(ddata[0])
        doctorEmail = ddata[0].email;
        doctorName = ddata[0].doctorname
    } catch (err) {
        console.error("Error fetching doctor email:", err);
        throw err;
    }
    //console.log("---------",patientName,doctorName)
    const pmessage = `Hello,${patientName} Your appointment is scheduled on ${date} at ${time}`;
    const dmessage = `${doctorName} your appointment is scheduled on ${date} at ${time}`;
    
    //console.log("Patient Message:", pmessage);
    //console.log("Doctor Message:", dmessage);
    //console.log("Patient Email:", patientEmail);
    //console.log("Doctor Email:", doctorEmail);
    try{
        await sendEmail(patientEmail, pmessage);
    }
    catch(err){
        console.log(err.message)
    }
    try{   
        sendEmail(doctorEmail, dmessage);
    }catch(err){
        console.log(err.message)
    }
    await new Promise((resolve) => setTimeout(resolve, 2000)); 

    console.log("Email sent");
}


async function fetchAppointments(req,res,next)
{
    const date = req.query.date||req.body.date
    const doctorid = req.query.doctorID||req.body.doctorID
    //console.log(date,doctorid)
    if(!date){
        return res.status(400).json({err:"Date Parameter is required"});
    }
    try{
        const {data,error} = await supabase
        .from('appointments')
        .select('time')
        .eq('doctorid',doctorid)
        .eq('date',date)
        if(error){
            return res.status(500).json({err:error.message})
        }
        req.appointments = data;
        next();
    }catch(err){
        console.log("HERE")
        return res.status(500).json({err:err.message})
    }
}

router.post("/book",fetchAppointments,async (req, res) => 
{
    const { patientID, doctorID, date} = req.body;
    //console.log("GET /book appointments:", req.appointments);

    //console.log(req.appointments)
    const timeslot = []
    for(var i=0;i<req.appointments.length;i++)
        {
            const [hours,minutes] = req.appointments[i].time.split(":").map(Number);
            timeslot.push(hours * 60 + minutes)
        }
    timeslot.sort((a,b)=>a-b);
    //console.log(timeslot)
    var availtimeslot = null;
    var flag = 0;
    for(var i=0;i<timeslot.length-1;i++)
        {
            var gap = timeslot[i+1]-timeslot[i]
            //console.log(gap)
            if(gap>=120)
                {
                    let availableSlot = timeslot[i] + 60; 
                    let hours = Math.floor(availableSlot / 60);
                    let minutes = availableSlot % 60;
                    availtimeslot = `${hours}:${minutes.toString().padStart(2, '0')}`; 
                    flag = 1;
                    break;
                }
            }
            if(!flag && timeslot.length==0)
            {
                console.log("HERE")
                availtimeslot = `12:00:00`
            }
            else if (!flag) 
            {
                let newslot = timeslot[timeslot.length - 1]; 
                let hours = Math.floor(newslot / 60);         
                let minutes = newslot % 60;                    
                //console.log(hours,minutes)
                hours += 1;  
                availtimeslot = `${hours}:${minutes.toString().padStart(2, '0')}`;  
            }

            console.log(`Available Time Slot: ${availtimeslot}`);
    try {
        const { data, error } = await supabase
            .from("appointments")
            .insert([{ patientid: patientID, doctorid: doctorID, date: date, time: availtimeslot }])
            .select("appointmentid");
        
        if (error) {
            console.error("Supabase insert error:", error);
            return res.status(500).json({ err: error.message });
        }
        
        //console.log("Inserted appointment:", data);
        await Mail(doctorID,patientID,date,availtimeslot)
        return res.status(200).json({ 
            success: true, 
            appointmentid: data[0].appointmentid, 
        });
    } catch (err) {
        console.log("HERE")
        return res.status(500).json({ err: err.message });
    }
});

router.get("/getappointments", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select('*'); 
    
        if (error) {
            console.error('Supabase fetch error:', error);
            return res.status(500).json({ error: error.message });
        }
    
        if (!data || data.length === 0) {
            console.log("No appointments found");
            return res.status(404).json({ error: "Appointments not found" });
        }
    
        return res.status(200).json({ appointmentDetails: data });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});


router.get("/:id", async (req, res) => {
    //console.log("INSIDE get appointments api");
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('appointmentid', id)
            .single();
        
        if (error) {
            console.error('Supabase fetch error:', error);
            return res.status(500).json({ error: error.message });
        }
        
        if (!data) 
            {
                console.log("data NOT found");
            return res.status(404).json({ error: "Appointment not found" });
        }
        
        return res.status(200).json({ appointmentDetails: data });
    } catch (err) {
        return res.status(500).json({ err: err.message });
    }
});

router.delete("/:id/cancel", async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('appointmentid', id)
            .single();
        
        if (error || !data) {
            return res.status(404).json({ error: "Appointment not found" });
        }
        
        const { error: deleteError } = await supabase
            .from('appointments')
            .delete()
            .eq('appointmentid', id);

        if (deleteError) {
            console.error("Supabase delete error:", deleteError);
            return res.status(500).json({ error: deleteError.message });
        }
        
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ err: err.message });
    }
});

module.exports = router;
